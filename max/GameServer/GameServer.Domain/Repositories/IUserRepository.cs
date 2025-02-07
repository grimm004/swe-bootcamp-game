using GameServer.Domain.Models;

namespace GameServer.Domain.Repositories;

public interface IUserRepository
{
    Task<User?> CreateUserAsync(string username, byte[] passwordSalt, byte[] passwordHash, string displayName, CancellationToken token = default);
    Task<User?> GetUserByUsernameAsync(string username, CancellationToken token = default);
    Task<User?> GetUserByIdAsync(Guid id, CancellationToken token = default);
    Task<User?> GetUserBySessionIdAsync(Guid sessionId, CancellationToken token = default);
    Task<User?> UpdateUserAsync(Guid userId, string? displayName, CancellationToken token = default);
}