using System.Diagnostics.CodeAnalysis;
using GameServer.Api.Constants;
using GameServer.Api.Contracts.Requests;
using GameServer.Api.Contracts.Responses;
using GameServer.Api.Mappers;
using GameServer.Domain.Services;
using Microsoft.AspNetCore.Mvc;

namespace GameServer.Api.Endpoints;

[ExcludeFromCodeCoverage]
internal static class AdminEndpoints
{
    private const string AdminRoute = "/admin";

    public static IEndpointRouteBuilder MapAdminAuthEndpoints(this IEndpointRouteBuilder builder)
    {
        var adminRoute = builder.MapGroup(AdminRoute)
            .RequireAuthorization(AuthPolicies.AdminOnly);

        adminRoute.MapRoleEndpoints();
        adminRoute.MapUserRoleEndpoints();

        return builder;
    }

    private static IEndpointRouteBuilder MapRoleEndpoints(this IEndpointRouteBuilder adminRoute)
    {
        var builder = adminRoute.MapGroup("/roles");

        builder
            .MapPost("", CreateRole)
            .WithName(nameof(CreateRole))
            .Accepts<CreateAuthRoleRequest>(ContentTypes.ApplicationJson)
            .Produces<AuthRoleResponse>(StatusCodes.Status201Created)
            .Produces(StatusCodes.Status409Conflict)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        builder
            .MapGet("", GetRoles)
            .WithName(nameof(GetRoles))
            .Produces<IEnumerable<AuthRoleResponse>>()
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        builder
            .MapGet("/{name}", GetRole)
            .WithName(nameof(GetRole))
            .Produces<AuthRoleResponse>()
            .Produces(StatusCodes.Status404NotFound)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        builder
            .MapPut("/{name}", UpdateRole)
            .WithName(nameof(UpdateRole))
            .Accepts<UpdateAuthRoleRequest>(ContentTypes.ApplicationJson)
            .Produces<AuthRoleResponse>()
            .Produces(StatusCodes.Status404NotFound)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        builder
            .MapDelete("/{name}", DeleteRole)
            .WithName(nameof(DeleteRole))
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        return adminRoute;
    }

    private static IEndpointRouteBuilder MapUserRoleEndpoints(this IEndpointRouteBuilder adminRoute)
    {
        var builder = adminRoute.MapGroup("/users/{userId}/roles");

        builder
            .MapGet("", GetUserRoles)
            .WithName(nameof(GetUserRoles))
            .Produces<IEnumerable<AuthRoleResponse>>()
            .Produces(StatusCodes.Status404NotFound)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        builder
            .MapPost("/{roleName}", AssignRoleToUser)
            .WithName(nameof(AssignRoleToUser))
            .Produces<AuthRoleResponse>()
            .Produces(StatusCodes.Status404NotFound)
            .Produces(StatusCodes.Status409Conflict)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        builder
            .MapDelete("/{roleName}", UnassignRoleFromUser)
            .WithName(nameof(UnassignRoleFromUser))
            .Produces(StatusCodes.Status204NoContent)
            .Produces(StatusCodes.Status404NotFound)
            .Produces<ProblemDetails>(StatusCodes.Status500InternalServerError);

        return adminRoute;
    }

    private static async Task<IResult> CreateRole(CreateAuthRoleRequest request, IAdminAuthService adminAuthService, CancellationToken token)
    {
        var result = await adminAuthService.CreateRoleAsync(request.MapToNewAuthRole(), token);

        return result.Match<IResult>(
            role => Results.CreatedAtRoute(nameof(GetRole), new { name = role.Name }, role.MapToAuthRoleResponse()),
            _ => Results.Conflict(),
            error => Results.Problem(error.Value, statusCode: StatusCodes.Status500InternalServerError));
    }

    private static async Task<IResult> GetRoles(IAdminAuthService adminAuthService, CancellationToken token)
    {
        var result = await adminAuthService.GetRolesAsync(token);

        return result.Match<IResult>(
            roles => Results.Ok(roles.Select(r => r.MapToAuthRoleResponse())),
            error => Results.Problem(error.Value, statusCode: StatusCodes.Status500InternalServerError));
    }

    private static async Task<IResult> GetRole(string name, IAdminAuthService adminAuthService, CancellationToken token)
    {
        var result = await adminAuthService.GetRoleByIdAsync(name, token);

        return result.Match<IResult>(
            role => Results.Ok(role.MapToAuthRoleResponse()),
            _ => Results.NotFound(),
            error => Results.Problem(error.Value, statusCode: StatusCodes.Status500InternalServerError));
    }

    private static async Task<IResult> UpdateRole(string name, UpdateAuthRoleRequest request, IAdminAuthService adminAuthService, CancellationToken token)
    {
        var result = await adminAuthService.UpdateRoleAsync(name, request.MapToAuthRoleUpdate(), token);

        return result.Match<IResult>(
            role => Results.Ok(role.MapToAuthRoleResponse()),
            _ => Results.NotFound(),
            error => Results.Problem(error.Value, statusCode: StatusCodes.Status500InternalServerError));
    }

    private static async Task<IResult> DeleteRole(string name, IAdminAuthService adminAuthService, CancellationToken token)
    {
        var result = await adminAuthService.DeleteRoleAsync(name, token);

        return result.Match<IResult>(
            _ => Results.NoContent(),
            _ => Results.NotFound(),
            error => Results.Problem(error.Value, statusCode: StatusCodes.Status500InternalServerError));
    }

    private static async Task<IResult> GetUserRoles(Guid userId, IAdminAuthService adminAuthService, CancellationToken token)
    {
        var result = await adminAuthService.GetRolesByUserIdAsync(userId, token);

        return result.Match<IResult>(
            roles => Results.Ok(roles.Select(r => r.MapToAuthRoleResponse())),
            _ => Results.NotFound(),
            error => Results.Problem(error.Value, statusCode: StatusCodes.Status500InternalServerError));
    }

    private static async Task<IResult> AssignRoleToUser(Guid userId, string roleName, IAdminAuthService adminAuthService, CancellationToken token)
    {
        var result = await adminAuthService.AddRoleToUserAsync(userId, roleName, token);

        return result.Match<IResult>(
            role => Results.Ok(role.MapToAuthRoleResponse()),
            _ => Results.NotFound(),
            _ => Results.Conflict(),
            error => Results.Problem(error.Value, statusCode: StatusCodes.Status500InternalServerError));
    }

    private static async Task<IResult> UnassignRoleFromUser(Guid userId, string roleName, IAdminAuthService adminAuthService, CancellationToken token)
    {
        var result = await adminAuthService.RemoveRoleFromUserAsync(userId, roleName, token);

        return result.Match<IResult>(
            _ => Results.NoContent(),
            _ => Results.NotFound(),
            error => Results.Problem(error.Value, statusCode: StatusCodes.Status500InternalServerError));
    }
}