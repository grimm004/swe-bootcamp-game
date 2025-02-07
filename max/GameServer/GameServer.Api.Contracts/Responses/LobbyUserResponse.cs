namespace GameServer.Api.Contracts.Responses;

public record LobbyUserResponse(Guid Id, string Username, string DisplayName);