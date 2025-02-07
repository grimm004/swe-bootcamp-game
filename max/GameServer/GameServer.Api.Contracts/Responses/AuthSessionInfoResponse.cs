namespace GameServer.Api.Contracts.Responses;

public record AuthSessionInfoResponse(UserResponse User, DateTime ExpiresAt);