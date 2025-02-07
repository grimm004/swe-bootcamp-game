namespace GameServer.Api.Contracts.Requests;

public record RegisterRequest(string Username, string Password, string DisplayName);