namespace GameServer.Api.Contracts.Responses;

public record LobbyResponse(Guid Id, string JoinCode, Guid HostId, IEnumerable<LobbyUserResponse> Users);