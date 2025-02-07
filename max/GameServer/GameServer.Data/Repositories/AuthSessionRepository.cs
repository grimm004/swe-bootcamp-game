using GameServer.Data.Entities;
using GameServer.Data.Mappers;
using GameServer.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace GameServer.Data.Repositories;

public class AuthSessionRepository(GameServerDbContext dbContext) : IAuthSessionRepository
{
    public async Task<Domain.Models.AuthSessionInfo?> CreateSessionAsync(Guid userId, byte[] authTokenHash, CancellationToken token = default)
    {
        var user = await dbContext.Users.FindAsync([userId], token);

        if (user is null)
            return null;

        var entity = new AuthSession
        {
            UserId = userId,
            TokenHash = authTokenHash,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            RevokedAt = null,
            User = user
        };

        await dbContext.AuthSessions.AddAsync(entity, token);
        var rowsChanged = await dbContext.SaveChangesAsync(token);

        return rowsChanged > 0 ? entity.MapToAuthSessionInfo() : null;
    }

    public async Task<IEnumerable<Domain.Models.AuthSessionInfo>> GetActiveSessionsByUserAsync(Guid userId, CancellationToken token = default)
    {
        var entities = await dbContext.AuthSessions.AsNoTracking()
            .Where(x => x.UserId == userId && x.RevokedAt == null)
            .ToListAsync(token);

        return entities.Select(DomainMappers.MapToAuthSessionInfo);
    }

    public async Task<Domain.Models.AuthSessionInfo?> GetSessionByTokenHashAsync(byte[] authTokenHash, CancellationToken token = default)
    {
        var entity = await dbContext.AuthSessions.AsNoTracking()
            .Include(x => x.User)
            .ThenInclude(x => x.Roles)
            .FirstOrDefaultAsync(x => x.TokenHash == authTokenHash, token);

        return entity?.MapToAuthSessionInfo();
    }

    public async Task<bool> RevokeSessionAsync(Guid sessionId, CancellationToken token = default)
    {
        var entity = await dbContext.AuthSessions.FindAsync([sessionId], token);

        if (entity is null)
            return false;

        entity.RevokedAt = DateTime.UtcNow;
        var rowsChanged = await dbContext.SaveChangesAsync(token);

        return rowsChanged > 0;
    }
}