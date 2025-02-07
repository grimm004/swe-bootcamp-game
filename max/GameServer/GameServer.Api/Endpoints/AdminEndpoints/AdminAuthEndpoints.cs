using GameServer.Api.Contracts.Requests;
using GameServer.Api.Mappers;
using GameServer.Domain.Services;

namespace GameServer.Api.Endpoints.AdminEndpoints;

public static class AdminAuthEndpoints
{
    public static IEndpointRouteBuilder MapAdminAuthEndpoints(this IEndpointRouteBuilder builder)
    {
        builder.MapGroup("/auth/admin")
            .MapRoleEndpoints()
            .MapUserRoleEndpoints();

        return builder;
    }

    private static IEndpointRouteBuilder MapRoleEndpoints(this IEndpointRouteBuilder builder)
    {
        var rolesRoute = builder.MapGroup("/roles");

        rolesRoute.MapCreateRoleEndpoint();
        rolesRoute.MapGetRolesEndpoint();
        rolesRoute.MapGetRoleByIdEndpoint();
        rolesRoute.MapUpdateRoleEndpoint();
        rolesRoute.MapDeleteRoleEndpoint();

        return builder;
    }

    private static IEndpointRouteBuilder MapUserRoleEndpoints(this IEndpointRouteBuilder builder)
    {
        var userRolesRoute = builder.MapGroup("/users/{userId}/roles");

        userRolesRoute.MapGetUserRolesEndpoint();
        userRolesRoute.MapAssignRoleToUserEndpoint();
        userRolesRoute.MapUnassignRoleFromUserEndpoint();

        return builder;
    }

    private static RouteHandlerBuilder MapCreateRoleEndpoint(this IEndpointRouteBuilder builder) =>
        builder.MapPost("", async (CreateAuthRoleRequest request, IAdminAuthService adminAuthService, CancellationToken token) =>
        {
            var result = await adminAuthService.CreateRoleAsync(request.MapToNewAuthRole(), token);

            return result.Match<IResult>(
                role => Results.Ok(role.MapToAuthRoleResponse()),
                _ => Results.Conflict(),
                error => Results.BadRequest(error.Value));
        });

    private static RouteHandlerBuilder MapGetRolesEndpoint(this IEndpointRouteBuilder builder) =>
        builder.MapGet("", async (IAdminAuthService adminAuthService, CancellationToken token) =>
        {
            var result = await adminAuthService.GetRolesAsync(token);

            return result.Match<IResult>(
                roles => Results.Ok(roles.Select(r => r.MapToAuthRoleResponse())),
                _ => Results.NotFound(),
                error => Results.BadRequest(error.Value));
        });

    private static RouteHandlerBuilder MapGetRoleByIdEndpoint(this IEndpointRouteBuilder builder) =>
        builder.MapGet("/{roleId:guid}", async (Guid roleId, IAdminAuthService adminAuthService, CancellationToken token) =>
        {
            var result = await adminAuthService.GetRoleByIdAsync(roleId, token);

            return result.Match<IResult>(
                role => Results.Ok(role.MapToAuthRoleResponse()),
                _ => Results.NotFound(),
                error => Results.BadRequest(error.Value));
        });

    private static RouteHandlerBuilder MapUpdateRoleEndpoint(this IEndpointRouteBuilder builder) =>
        builder.MapPut("/{roleId:guid}", async (Guid roleId, UpdateAuthRoleRequest request, IAdminAuthService adminAuthService, CancellationToken token) =>
        {
            var result = await adminAuthService.UpdateRoleAsync(roleId, request.MapToAuthRoleUpdate(), token);

            return result.Match<IResult>(
                role => Results.Ok(role.MapToAuthRoleResponse()),
                _ => Results.NotFound(),
                error => Results.BadRequest(error.Value));
        });

    private static RouteHandlerBuilder MapDeleteRoleEndpoint(this IEndpointRouteBuilder builder) =>
        builder.MapDelete("/{roleId:guid}", async (Guid roleId, IAdminAuthService adminAuthService, CancellationToken token) =>
        {
            var result = await adminAuthService.DeleteRoleAsync(roleId, token);

            return result.Match<IResult>(
                _ => Results.NoContent(),
                _ => Results.NotFound(),
                error => Results.BadRequest(error.Value));
        });

    private static RouteHandlerBuilder MapGetUserRolesEndpoint(this IEndpointRouteBuilder builder) =>
        builder.MapGet("", async (Guid userId, IAdminAuthService adminAuthService, CancellationToken token) =>
        {
            var result = await adminAuthService.GetRolesByUserIdAsync(userId, token);

            return result.Match<IResult>(
                roles => Results.Ok(roles.Select(r => r.MapToAuthRoleResponse())),
                _ => Results.NotFound(),
                error => Results.BadRequest(error.Value));
        });

    private static RouteHandlerBuilder MapAssignRoleToUserEndpoint(this IEndpointRouteBuilder builder) =>
        builder.MapPost("/{roleId:guid}", async (Guid userId, Guid roleId, IAdminAuthService adminAuthService, CancellationToken token) =>
        {
            var result = await adminAuthService.AddRoleToUserAsync(userId, roleId, token);

            return result.Match<IResult>(
                role => Results.Ok(role.MapToAuthRoleResponse()),
                _ => Results.NotFound(),
                _ => Results.Conflict(),
                error => Results.BadRequest(error.Value));
        });

    private static RouteHandlerBuilder MapUnassignRoleFromUserEndpoint(this IEndpointRouteBuilder builder) =>
        builder.MapDelete("/{roleId:guid}", async (Guid userId, Guid roleId, IAdminAuthService adminAuthService, CancellationToken token) =>
        {
            var result = await adminAuthService.RemoveRoleFromUserAsync(userId, roleId, token);

            return result.Match<IResult>(
                _ => Results.NoContent(),
                _ => Results.NotFound(),
                error => Results.BadRequest(error.Value));
        });
}