using GameServer.Domain.Models;

namespace GameServer.Domain.Repositories;

public interface IAuthSessionRepository
{
    Task<AuthSessionInfo?> CreateSessionAsync(Guid userId, byte[] authTokenHash, CancellationToken token = default);
    Task<IEnumerable<AuthSessionInfo>> GetActiveSessionsByUserAsync(Guid userId, CancellationToken token = default);
    Task<AuthSessionInfo?> GetSessionByTokenHashAsync(byte[] authTokenHash, CancellationToken token = default);
    Task<bool> RevokeSessionAsync(Guid sessionId, CancellationToken token = default);
}