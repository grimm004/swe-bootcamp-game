namespace GameServer.Api.Contracts.Responses;

public record UserResponse(Guid Id, string Username, string DisplayName, IEnumerable<string> Roles);