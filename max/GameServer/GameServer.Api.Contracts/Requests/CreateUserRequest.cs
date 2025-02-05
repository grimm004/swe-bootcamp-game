namespace GameServer.Api.Contracts.Requests;

public record CreateUserRequest(string Email, string Password, string Username, string DisplayName);