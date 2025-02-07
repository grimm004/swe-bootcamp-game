using GameServer.Data.Entities;

namespace GameServer.Data.Mappers;

internal static class DomainMappers
{
    public static Domain.Models.AuthRole MapToAuthRole(this AuthRole authRole) =>
        new()
        {
            Id = authRole.Id,
            Name = authRole.Name,
            Description = authRole.Description
        };

    public static Domain.Models.User MapToUser(this User user) =>
        new()
        {
            Id = user.Id,
            Username = user.Username,
            DisplayName = user.DisplayName,
            PasswordSalt = user.PasswordSalt,
            PasswordHash = user.PasswordHash,
            Roles = user.Roles?.Select(r => r.Name).ToList()!
        };

    public static Domain.Models.AuthSessionInfo MapToAuthSessionInfo(this AuthSession authSession) =>
        new()
        {
            Id = authSession.Id,
            User = authSession.User?.MapToUser()!,
            ExpiresAt = authSession.ExpiresAt
        };
}