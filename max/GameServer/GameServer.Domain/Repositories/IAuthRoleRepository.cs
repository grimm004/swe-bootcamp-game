using GameServer.Domain.Models;

namespace GameServer.Domain.Repositories;

public interface IAuthRoleRepository
{
    Task<AuthRole?> CreateRoleAsync(NewAuthRole role, CancellationToken token = default);
    Task<AuthRole?> GetRoleByNameAsync(string name, CancellationToken token = default);
    Task<IEnumerable<AuthRole>> GetRolesAsync(CancellationToken token = default);
    Task<bool> UpdateRoleAsync(string name, AuthRoleUpdate role, CancellationToken token = default);
    Task<bool> DeleteRoleAsync(string name, CancellationToken token = default);
    Task<IEnumerable<AuthRole>> GetRolesByUserIdAsync(Guid userId, CancellationToken token = default);
    Task<bool> AddRoleToUserAsync(Guid userId, string roleName, CancellationToken token = default);
    Task<bool> RemoveRoleFromUserAsync(Guid userId, string roleName, CancellationToken token = default);
}