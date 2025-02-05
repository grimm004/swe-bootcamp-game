namespace GameServer.Api.Contracts.Requests;

public record UpdateUserRequest(string Email, string Username, string? DisplayName);