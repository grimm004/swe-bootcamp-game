using GameServer.Domain.Models;

namespace GameServer.Domain.Repositories;

public interface IAuthRoleRepository
{
    Task<AuthRole?> CreateRoleAsync(NewAuthRole role, CancellationToken token = default);
    Task<AuthRole?> GetRoleByIdAsync(Guid id, CancellationToken token = default);
    Task<IEnumerable<AuthRole>> GetRolesAsync(CancellationToken token = default);
    Task<bool> UpdateRoleAsync(Guid id, AuthRoleUpdate role, CancellationToken token = default);
    Task<bool> DeleteRoleAsync(Guid id, CancellationToken token = default);
    Task<IEnumerable<AuthRole>> GetRolesByUserIdAsync(Guid userId, CancellationToken token = default);
    Task<bool> AddRoleToUserAsync(Guid userId, Guid roleId, CancellationToken token = default);
    Task<bool> RemoveRoleFromUserAsync(Guid userId, Guid roleId, CancellationToken token = default);
}