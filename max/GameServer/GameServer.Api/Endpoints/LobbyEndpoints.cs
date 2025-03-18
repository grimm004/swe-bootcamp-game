using System.Diagnostics.CodeAnalysis;
using GameServer.Api.Constants;
using GameServer.Api.Contracts.Requests;
using GameServer.Api.Contracts.Responses;
using GameServer.Api.Hubs;
using GameServer.Api.Mappers;
using GameServer.Domain.Models;
using GameServer.Domain.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace GameServer.Api.Endpoints;

[ExcludeFromCodeCoverage]
internal static class LobbyEndpoints
{
    private const string Route = "/lobbies";
    private const string Category = "LobbyEndpoints";

    public static IEndpointRouteBuilder MapLobbyEndpoints(this IEndpointRouteBuilder builder)
    {
        var lobbyRoute = builder.MapGroup(Route)
            .RequireAuthorization(AuthPolicies.Player);

        lobbyRoute
            .MapPost("", CreateLobby)
            .WithName(nameof(CreateLobby))
            .Accepts<CreateLobbyRequest>(ContentTypes.ApplicationJson)
            .Produces<LobbyResponse>(StatusCodes.Status201Created)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        lobbyRoute
            .MapGet("", GetLobbies)
            .WithName(nameof(GetLobbies))
            .Produces<IEnumerable<LobbyResponse>>()
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        lobbyRoute
            .MapGet("/{id:guid}", GetLobby)
            .WithName(nameof(GetLobby))
            .Produces<LobbyResponse>()
            .Produces(StatusCodes.Status404NotFound)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        lobbyRoute
            .MapDelete("/{id:guid}", DeleteLobby)
            .WithName(nameof(DeleteLobby))
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        lobbyRoute
            .MapPost("/{id:guid}/users", JoinLobby)
            .WithName(nameof(JoinLobby))
            .Accepts<JoinLobbyRequest>(ContentTypes.ApplicationJson)
            .Produces<LobbyResponse>()
            .Produces(StatusCodes.Status404NotFound)
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        lobbyRoute
            .MapDelete("/{id:guid}/users/{userId:guid}", LeaveLobby)
            .WithName(nameof(LeaveLobby))
            .Produces<LobbyResponse>()
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status403Forbidden)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        return builder;
    }

    private static async Task<IResult> CreateLobby(
        ILobbyService lobbyService, ILoggerFactory loggerFactory, HttpContext context, IHubContext<LobbyHub> lobbyHub, CancellationToken token)
    {
        var user = (User)context.Items["User"]!;

        var logger = loggerFactory.CreateLogger(Category);
        logger.LogInformation("Request to create lobby for: {Username}", user.Username);

        var lobbyResult = await lobbyService.CreateLobbyAsync(user.Id, token);

        return await lobbyResult.Match<Task<IResult>>(
            async lobby =>
            {
                await lobbyHub.Clients.Group(lobby.Id.ToString())
                    .SendAsync("PlayerJoined", user.Id.ToString(), cancellationToken: token);
                return Results.CreatedAtRoute(nameof(GetLobby), new { id = lobby.Id }, lobby.MapToResponse());
            },
            error => Task.FromResult(Results.Problem(error.Value, statusCode: StatusCodes.Status500InternalServerError)));
    }

    private static async Task<IResult> GetLobbies([FromQuery(Name = "code")] string joinCode, ILobbyService lobbyService, CancellationToken token)
    {
        if (string.IsNullOrWhiteSpace(joinCode))
            return Results.Problem("Invalid join code.", statusCode: StatusCodes.Status400BadRequest);

        var lobbyResult = await lobbyService.GetLobbyByJoinCodeAsync(joinCode, token);

        return lobbyResult.Match<IResult>(
            lobby => Results.Ok(new[] { lobby.MapToResponse() }),
            _ => Results.Ok(Array.Empty<LobbyResponse>()),
            error => Results.Problem(error.Value, statusCode: StatusCodes.Status500InternalServerError));
    }

    private static async Task<IResult> GetLobby(
        Guid id, ILobbyService lobbyService, CancellationToken token)
    {
        var lobbyResult = await lobbyService.GetLobbyByIdAsync(id, token);

        return lobbyResult.Match<IResult>(
            lobby => Results.Ok(lobby.MapToResponse()),
            _ => Results.NotFound(),
            error => Results.Problem(error.Value, statusCode: StatusCodes.Status500InternalServerError));
    }

    private static async Task<IResult> DeleteLobby(
        Guid id, ILobbyService lobbyService, IHubContext<LobbyHub> lobbyHub, CancellationToken token)
    {
        var lobbyResult = await lobbyService.DisbandLobbyAsync(id, token);

        return await lobbyResult.Match<Task<IResult>>(
            async _ =>
            {
                await lobbyHub.Clients.Group(id.ToString())
                    .SendAsync("LobbyDisbanded", cancellationToken: token);
                return Results.NoContent();
            },
            _ => Task.FromResult(Results.NotFound()),
            error => Task.FromResult(Results.Problem(error.Value, statusCode: StatusCodes.Status500InternalServerError)));
    }

    private static async Task<IResult> JoinLobby(
        Guid id, JoinLobbyRequest request, ILobbyService lobbyService, HttpContext context, IHubContext<LobbyHub> lobbyHub, CancellationToken token)
    {
        var user = (User)context.Items["User"]!;

        var lobbyResult = await lobbyService.JoinLobbyAsync(user.Id, request.JoinCode, token);

        return await lobbyResult.Match<Task<IResult>>(
            async lobby =>
            {
                await lobbyHub.Clients.Group(id.ToString())
                    .SendAsync("PlayerJoined", user.Id.ToString(), cancellationToken: token);
                return Results.Ok(lobby.MapToResponse());
            },
            _ => Task.FromResult(Results.NotFound()),
            _ => Task.FromResult(Results.Problem("Lobby is closed.", statusCode: StatusCodes.Status400BadRequest)),
            _ => Task.FromResult(Results.Problem("Invalid join code.", statusCode: StatusCodes.Status400BadRequest)),
            error => Task.FromResult(Results.Problem(error.Value, statusCode: StatusCodes.Status500InternalServerError)));
    }

    private static async Task<IResult> LeaveLobby(
        Guid id, Guid userId, ILobbyService lobbyService, HttpContext context, IHubContext<LobbyHub> lobbyHub, CancellationToken token)
    {
        var user = (User)context.Items["User"]!;
        var lobbyResult = await lobbyService.GetLobbyByIdAsync(id, token);

        if (!lobbyResult.TryPickT0(out var lobby, out var errorResult))
            return errorResult.Match(
                _ => Results.NotFound(),
                error => Results.Problem(error.Value, statusCode: StatusCodes.Status500InternalServerError));

        if (user.Id != userId && user.Id != lobby.HostId && !user.Roles.Contains("admin"))
            return Results.Forbid();

        if (userId == lobby.HostId)
        {
            var disbandResult = await lobbyService.DisbandLobbyAsync(id, token);

            return await disbandResult.Match<Task<IResult>>(
                async _ =>
                {
                    await lobbyHub.Clients.Group(id.ToString())
                        .SendAsync("LobbyDisbanded", cancellationToken: token);
                    return Results.NoContent();
                },
                _ => Task.FromResult(Results.NotFound()),
                error => Task.FromResult(Results.Problem(error.Value, statusCode: StatusCodes.Status500InternalServerError)));
        }

        var lobbyDeleteResult = await lobbyService.LeaveLobbyAsync(userId, token);

        return await lobbyDeleteResult.Match<Task<IResult>>(
            async updatedLobby =>
            {
                await lobbyHub.Clients.Group(id.ToString())
                    .SendAsync("PlayerLeft", userId.ToString(), cancellationToken: token);
                return Results.Ok(updatedLobby.MapToResponse());
            },
            _ => Task.FromResult(Results.NotFound()),
            error => Task.FromResult(Results.Problem(error.Value, statusCode: StatusCodes.Status500InternalServerError)));
    }
}
