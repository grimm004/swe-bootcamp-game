namespace GameServer.Api.Contracts.Responses;

public record UserResponse(Guid Id, string Email, string Username, string Name);