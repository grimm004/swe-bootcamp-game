using GameServer.Data.Entities;

namespace GameServer.Data.Mappers;

internal static class DomainMappers
{
    public static Domain.Models.AuthRole MapToAuthRole(this AuthRole authRole) =>
        new()
        {
            Name = authRole.Name,
            Description = authRole.Description
        };

    public static Domain.Models.User MapToUser(this User user) =>
        new()
        {
            Id = user.Id,
            Username = user.Username,
            DisplayName = user.DisplayName,
            PasswordSalt = user.AuthCredentials.PasswordSalt,
            PasswordHash = user.AuthCredentials.PasswordHash,
            Roles = user.Roles?.Select(r => r.Name).ToList()!
        };

    public static Domain.Models.AuthSessionInfo MapToAuthSessionInfo(this AuthSession authSession) =>
        new()
        {
            Id = authSession.Id,
            User = authSession.User?.MapToUser()!,
            CreatedAt = authSession.CreatedAt,
            ExpiresAt = authSession.ExpiresAt,
            RevokedAt = authSession.RevokedAt
        };

    public static Domain.Models.Lobby MapToLobby(this Lobby lobby) =>
        new()
        {
            Id = lobby.Id,
            HostId = lobby.HostId,
            JoinCode = lobby.JoinCode,
            Status = lobby.Status.MapToLobbyStatus(),
            Users = lobby.Users.Select(MapToUser).ToList()
        };

    private static Domain.Models.LobbyStatus MapToLobbyStatus(this LobbyStatus lobbyStatus) =>
        lobbyStatus switch
        {
            LobbyStatus.Closed => Domain.Models.LobbyStatus.Closed,
            LobbyStatus.Open => Domain.Models.LobbyStatus.Open,
            LobbyStatus.InGame => Domain.Models.LobbyStatus.InGame,
            _ => throw new ArgumentOutOfRangeException(nameof(lobbyStatus), lobbyStatus, null)
        };

    public static LobbyStatus MapToLobbyStatus(this Domain.Models.LobbyStatus lobbyStatus) =>
        lobbyStatus switch
        {
            Domain.Models.LobbyStatus.Closed => LobbyStatus.Closed,
            Domain.Models.LobbyStatus.Open => LobbyStatus.Open,
            Domain.Models.LobbyStatus.InGame => LobbyStatus.InGame,
            _ => throw new ArgumentOutOfRangeException(nameof(lobbyStatus), lobbyStatus, null)
        };
}