using GameServer.Api.Constants;
using GameServer.Api.Contracts.Requests;
using GameServer.Api.Mappers;
using GameServer.Domain.Services;

namespace GameServer.Api.Endpoints;

public static class AdminEndpoints
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

        builder.MapPost("", CreateRole);
        builder.MapGet("", GetRoles);
        builder.MapGet("/{name}", GetRoleById);
        builder.MapPut("/{name}", UpdateRole);
        builder.MapDelete("/{name}", DeleteRole);

        return adminRoute;
    }

    private static IEndpointRouteBuilder MapUserRoleEndpoints(this IEndpointRouteBuilder adminRoute)
    {
        var builder = adminRoute.MapGroup("/users/{userId}/roles");

        builder.MapGet("", GetUserRoles);
        builder.MapPost("/{roleName}", AssignRoleToUser);
        builder.MapDelete("/{roleName}", UnassignRoleFromUser);

        return adminRoute;
    }

    private static async Task<IResult> CreateRole(CreateAuthRoleRequest request, IAdminAuthService adminAuthService, CancellationToken token)
    {
        var result = await adminAuthService.CreateRoleAsync(request.MapToNewAuthRole(), token);

        return result.Match<IResult>(
            role => Results.Ok(role.MapToAuthRoleResponse()),
            _ => Results.Conflict(),
            error => Results.BadRequest(error.Value));
    }

    private static async Task<IResult> GetRoles(IAdminAuthService adminAuthService, CancellationToken token)
    {
        var result = await adminAuthService.GetRolesAsync(token);

        return result.Match<IResult>(
            roles => Results.Ok(roles.Select(r => r.MapToAuthRoleResponse())),
            _ => Results.NotFound(),
            error => Results.BadRequest(error.Value));
    }

    private static async Task<IResult> GetRoleById(string name, IAdminAuthService adminAuthService, CancellationToken token)
    {
        var result = await adminAuthService.GetRoleByIdAsync(name, token);

        return result.Match<IResult>(
            role => Results.Ok(role.MapToAuthRoleResponse()),
            _ => Results.NotFound(),
            error => Results.BadRequest(error.Value));
    }

    private static async Task<IResult> UpdateRole(string name, UpdateAuthRoleRequest request, IAdminAuthService adminAuthService, CancellationToken token)
    {
        var result = await adminAuthService.UpdateRoleAsync(name, request.MapToAuthRoleUpdate(), token);

        return result.Match<IResult>(
            role => Results.Ok(role.MapToAuthRoleResponse()),
            _ => Results.NotFound(),
            error => Results.BadRequest(error.Value));
    }

    private static async Task<IResult> DeleteRole(string name, IAdminAuthService adminAuthService, CancellationToken token)
    {
        var result = await adminAuthService.DeleteRoleAsync(name, token);

        return result.Match<IResult>(
            _ => Results.NoContent(),
            _ => Results.NotFound(),
            error => Results.BadRequest(error.Value));
    }

    private static async Task<IResult> GetUserRoles(Guid userId, IAdminAuthService adminAuthService, CancellationToken token)
    {
        var result = await adminAuthService.GetRolesByUserIdAsync(userId, token);

        return result.Match<IResult>(
            roles => Results.Ok(roles.Select(r => r.MapToAuthRoleResponse())),
            _ => Results.NotFound(),
            error => Results.BadRequest(error.Value));
    }

    private static async Task<IResult> AssignRoleToUser(Guid userId, string roleName, IAdminAuthService adminAuthService, CancellationToken token)
    {
        var result = await adminAuthService.AddRoleToUserAsync(userId, roleName, token);

        return result.Match<IResult>(
            role => Results.Ok(role.MapToAuthRoleResponse()),
            _ => Results.NotFound(),
            _ => Results.Conflict(),
            error => Results.BadRequest(error.Value));
    }

    private static async Task<IResult> UnassignRoleFromUser(Guid userId, string roleName, IAdminAuthService adminAuthService, CancellationToken token)
    {
        var result = await adminAuthService.RemoveRoleFromUserAsync(userId, roleName, token);

        return result.Match<IResult>(
            _ => Results.NoContent(),
            _ => Results.NotFound(),
            error => Results.BadRequest(error.Value));
    }
}