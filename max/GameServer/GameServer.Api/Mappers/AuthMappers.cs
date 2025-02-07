using GameServer.Api.Contracts.Requests;
using GameServer.Api.Contracts.Responses;
using GameServer.Domain.Models;

namespace GameServer.Api.Mappers;

public static class AuthMappers
{
    public static AuthRegistration MapToAuthRegistration(this RegisterRequest request) => new()
    {
        Username = request.Username,
        DisplayName = request.DisplayName,
        Password = request.Password
    };

    public static AuthCredentials MapToAuthCredentials(this LoginRequest request) => new()
    {
        Username = request.Username,
        Password = request.Password
    };

    public static UserResponse MapToResponse(this User user) =>
        new(user.Id, user.Username, user.DisplayName, user.Roles);

    public static AuthSessionResponse MapToResponse(this AuthSession session) =>
        new(session.User.MapToResponse(), session.Token, session.ExpiresAt);

    public static AuthSessionInfoResponse MapToResponse(this AuthSessionInfo sessionInfo) =>
        new(sessionInfo.User.MapToResponse(), sessionInfo.ExpiresAt);
}