using GameServer.Data.Mappers;
using GameServer.Domain.Models;
using GameServer.Domain.Repositories;
using Microsoft.EntityFrameworkCore;
using AuthRole = GameServer.Data.Entities.AuthRole;

namespace GameServer.Data.Repositories;

internal sealed class AuthRoleRepository(GameServerDbContext dbContext) : IAuthRoleRepository
{
    public async Task<Domain.Models.AuthRole?> CreateRoleAsync(NewAuthRole role, CancellationToken token = default)
    {
        var entity = new AuthRole
        {
            Name = role.Name,
            Description = role.Description
        };

        await dbContext.AuthRoles.AddAsync(entity, token);
        var rowsChanged = await dbContext.SaveChangesAsync(token);

        return rowsChanged > 0 ? entity.MapToAuthRole() : null;
    }

    public async Task<Domain.Models.AuthRole?> GetRoleByNameAsync(string name, CancellationToken token = default)
    {
        var entity = await dbContext.AuthRoles.FindAsync([name], token);

        return entity?.MapToAuthRole();
    }

    public async Task<IEnumerable<Domain.Models.AuthRole>> GetRolesAsync(CancellationToken token = default)
    {
        var entities = await dbContext.AuthRoles.ToListAsync(token);

        return entities.Select(DomainMappers.MapToAuthRole);
    }

    public async Task<bool> UpdateRoleAsync(string name, AuthRoleUpdate role, CancellationToken token = default)
    {
        var entity = await dbContext.AuthRoles.FindAsync([name], token);

        if (entity is null)
            return false;

        if (role.Name is not null)
            entity.Name = role.Name;

        if (role.Description is not null)
            entity.Description = role.Description;

        dbContext.AuthRoles.Update(entity);
        var rowsChanged = await dbContext.SaveChangesAsync(token);

        return rowsChanged > 0;
    }

    public async Task<bool> DeleteRoleAsync(string name, CancellationToken token = default)
    {
        var entity = await dbContext.AuthRoles.FindAsync([name], token);

        if (entity is null)
            return false;

        dbContext.AuthRoles.Remove(entity);
        var rowsChanged = await dbContext.SaveChangesAsync(token);

        return rowsChanged > 0;
    }

    public async Task<IEnumerable<Domain.Models.AuthRole>> GetRolesByUserIdAsync(Guid userId, CancellationToken token = default)
    {
        var entities = await dbContext.Users
            .Include(u => u.Roles)
            .Where(u => u.Id == userId)
            .SelectMany(u => u.Roles!)
            .ToListAsync(token);

        return entities.Select(DomainMappers.MapToAuthRole);
    }

    public async Task<bool> AddRoleToUserAsync(Guid userId, string roleName, CancellationToken token = default)
    {
        var user = await dbContext.Users.FindAsync([userId], token);
        var role = await dbContext.AuthRoles.FindAsync([roleName], token);

        if (user is null || role is null)
            return false;

        user.Roles!.Add(role);
        var rowsChanged = await dbContext.SaveChangesAsync(token);

        return rowsChanged > 0;
    }

    public async Task<bool> RemoveRoleFromUserAsync(Guid userId, string roleName, CancellationToken token = default)
    {
        var user = await dbContext.Users.FindAsync([userId], token);
        var role = await dbContext.AuthRoles.FindAsync([roleName], token);

        if (user is null || role is null)
            return false;

        user.Roles!.Remove(role);
        var rowsChanged = await dbContext.SaveChangesAsync(token);

        return rowsChanged > 0;
    }
}