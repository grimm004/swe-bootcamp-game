using GameServer.Api.Contracts.Requests;
using GameServer.Api.Contracts.Responses;
using GameServer.Domain.Models;

namespace GameServer.Api.Mappers;

internal static class AuthRoleMappers
{
    public static NewAuthRole MapToNewAuthRole(this CreateAuthRoleRequest request) =>
        new()
        {
            Name = request.Name,
            Description = request.Description
        };

    public static AuthRoleResponse MapToAuthRoleResponse(this AuthRole role) =>
        new(role.Name, role.Description);

    public static AuthRoleUpdate MapToAuthRoleUpdate(this UpdateAuthRoleRequest request) =>
        new()
        {
            Name = request.Name,
            Description = request.Description
        };
}