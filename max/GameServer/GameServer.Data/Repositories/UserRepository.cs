using GameServer.Data.Mappers;
using GameServer.Domain.Models;
using GameServer.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace GameServer.Data.Repositories;

public class UserRepository(GameServerDbContext dbContext) : IUserRepository
{
    public async Task<User?> CreateUserAsync(string username, byte[] passwordSalt, byte[] passwordHash, string displayName, CancellationToken token = default)
    {
        var user = new Entities.User
        {
            Username = username,
            PasswordSalt = passwordSalt,
            PasswordHash = passwordHash,
            DisplayName = displayName
        };

        dbContext.Users.Add(user);

        var updatedRows = await dbContext.SaveChangesAsync(token);
        return updatedRows == 1 ? user.MapToUser() : null;
    }

    public async Task<User?> GetUserByUsernameAsync(string username, CancellationToken token = default)
    {
        var user = await dbContext.Users.AsNoTracking()
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Username == username, token);

        return user?.MapToUser();
    }

    public async Task<User?> GetUserByIdAsync(Guid id, CancellationToken token = default)
    {
        var user = await dbContext.Users.AsNoTracking()
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == id, token);

        return user?.MapToUser();
    }

    public async Task<User?> GetUserBySessionIdAsync(Guid sessionId, CancellationToken token = default)
    {
        var user = await dbContext.Users.AsNoTracking()
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Sessions.Any(s => s.Id == sessionId), token);

        return user?.MapToUser();
    }

    public async Task<User?> UpdateUserAsync(string displayName, CancellationToken token = default)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(u => u.DisplayName == displayName, token);
        if (user == null)
            return null;

        user.DisplayName = displayName;
        dbContext.Users.Update(user);

        var updatedRows = await dbContext.SaveChangesAsync(token);
        return updatedRows == 1 ? user.MapToUser() : null;
    }
}