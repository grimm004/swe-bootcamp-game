namespace GameServer.Api.Contracts.Responses;

public record AuthSessionResponse(UserResponse User, string Token, DateTime ExpiresAt);