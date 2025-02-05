using GameServer.Api.Contracts.Requests;
using GameServer.Api.Contracts.Responses;
using GameServer.Domain.Models;

namespace GameServer.Api.Mappers;

public static class UserMappers
{
    public static UserCreation MapToCreation(this CreateUserRequest user) => new()
    {
        Username = user.Username,
        Email = user.Email,
        DisplayName = user.DisplayName,
        Password = user.Password
    };

    public static UserResponse MapToResponse(this User user) => new(user.Id, user.Email, user.Username, user.DisplayName);
}