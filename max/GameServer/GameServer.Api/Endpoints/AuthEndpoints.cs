using GameServer.Api.Constants;
using GameServer.Api.Contracts.Requests;
using GameServer.Api.Contracts.Responses;
using GameServer.Api.Mappers;
using GameServer.Domain.Models;
using GameServer.Domain.Services;
using Microsoft.AspNetCore.Mvc;

namespace GameServer.Api.Endpoints;

public static class AuthEndpoints
{
    private const string Route = "/auth";
    private const string Category = "AuthEndpoints";

    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder builder)
    {
        var authRoute = builder.MapGroup(Route);

        authRoute.MapPost("/register", Register)
            .WithName(nameof(Register))
            .AllowAnonymous()
            .Accepts<RegisterRequest>(ContentTypes.ApplicationJson)
            .Produces<UserResponse>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status409Conflict)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        authRoute.MapPost("/login", Login)
            .WithName(nameof(Login))
            .AllowAnonymous()
            .Accepts<LoginRequest>(ContentTypes.ApplicationJson)
            .Produces<AuthSessionResponse>()
            .Produces(StatusCodes.Status404NotFound)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        authRoute.MapPost("/logout", Logout)
            .WithName(nameof(Logout))
            .RequireAuthorization(AuthPolicies.AllAuthenticated)
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        authRoute.MapGet("/me", GetMe)
            .WithName(nameof(GetMe))
            .RequireAuthorization(AuthPolicies.AllAuthenticated)
            .Produces<AuthSessionInfoResponse>()
            .Produces(StatusCodes.Status404NotFound)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        authRoute.MapPut("/me", UpdateMe)
            .WithName(nameof(UpdateMe))
            .RequireAuthorization(AuthPolicies.AllAuthenticated)
            .Produces<UserResponse>()
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status401Unauthorized)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        return builder;
    }

    private static async Task<IResult> Register(RegisterRequest request, IAuthService authService, ILoggerFactory loggerFactory, CancellationToken token)
    {
        var logger = loggerFactory.CreateLogger(Category);
        logger.LogInformation("Request to register user: {Username}, {DisplayName}", request.Username, request.DisplayName);

        var registerResult = await authService.RegisterAsync(request.MapToAuthRegistration(), [AuthRoles.Player], token);

        return registerResult.Match<IResult>(
            user => Results.CreatedAtRoute(nameof(GetMe), null, user.MapToResponse()),
            _ => Results.Conflict(),
            error => Results.Problem(error.Value, statusCode: StatusCodes.Status500InternalServerError));
    }

    private static async Task<IResult> Login(LoginRequest request, IAuthService authService, CancellationToken token)
    {
        var loginResult = await authService.LoginAsync(request.MapToAuthCredentials(), token);

        return loginResult.Match<IResult>(
            authSession => Results.Ok(authSession.MapToResponse()),
            _ => Results.NotFound(),
            error => Results.Problem(error.Value, statusCode: StatusCodes.Status500InternalServerError));
    }

    private static async Task<IResult> Logout(HttpContext context, IAuthService authService, CancellationToken token)
    {
        var sessionToken = GetUserSessionToken(context);
        if (sessionToken is null) return Results.Unauthorized();

        var logoutResult = await authService.LogoutAsync(sessionToken, token);

        return logoutResult.Match<IResult>(
            _ => Results.NoContent(),
            _ => Results.NotFound(),
            error => Results.Problem(error.Value, statusCode: StatusCodes.Status500InternalServerError));
    }

    private static Task<IResult> GetMe(HttpContext context, CancellationToken token)
    {
        var session = GetUserSession(context);
        return Task.FromResult(session is null ? Results.Unauthorized() : Results.Ok(session.MapToResponse()));
    }

    private static async Task<IResult> UpdateMe(UpdateUserRequest request, HttpContext context, IAuthService authService, CancellationToken token)
    {
        var sessionToken = GetUserSessionToken(context);
        if (sessionToken is null) return Results.Unauthorized();

        var updateResult = await authService.UpdateProfileAsync(sessionToken, request.MapToUserUpdate(), token);

        return updateResult.Match<IResult>(
            user => Results.Ok(user.MapToResponse()),
            _ => Results.NotFound(),
            _ => Results.Unauthorized(),
            error => Results.Problem(error.Value, statusCode: StatusCodes.Status500InternalServerError));
    }

    private static AuthSessionInfo? GetUserSession(HttpContext context) =>
        context.Items.TryGetValue("UserSession", out var session) ? session as AuthSessionInfo : null;

    private static byte[]? GetUserSessionToken(HttpContext context) =>
        context.Items.TryGetValue("TokenData", out var sessionToken) ? sessionToken as byte[] : null;
}