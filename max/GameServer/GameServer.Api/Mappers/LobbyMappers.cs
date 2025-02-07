using GameServer.Api.Contracts.Responses;
using GameServer.Domain.Models;

namespace GameServer.Api.Mappers;

public static class LobbyMappers
{
    public static LobbyResponse MapToResponse(this Lobby lobby) =>
        new(lobby.Id, lobby.JoinCode, lobby.HostId, lobby.Users.Select(MapToLobbyResponse).ToList());

    private static LobbyUserResponse MapToLobbyResponse(this User user) => new(user.Id, user.Username, user.DisplayName);
}