using GameServer.Domain.Models;
using GameServer.Domain.Repositories;
using OneOf.Types;

namespace GameServer.Domain.Services.Implementation;

public class AdminAuthService(IAuthRoleRepository authRoleRepository) : IAdminAuthService
{
    public async Task<AuthRoleCreationResult> CreateRoleAsync(NewAuthRole role, CancellationToken token = default)
    {
        var authRole = await authRoleRepository.CreateRoleAsync(role, token);

        return authRole is null ? new AlreadyExists() : authRole;
    }

    public async Task<RolesResult> GetRolesAsync(CancellationToken token = default)
    {
        var authRoles = await authRoleRepository.GetRolesAsync(token);

        return authRoles.ToList();
    }

    public async Task<RoleResult> GetRoleByIdAsync(string roleName, CancellationToken token = default)
    {
        var authRole = await authRoleRepository.GetRoleByNameAsync(roleName, token);

        return authRole is null ? new NotFound() : authRole;
    }

    public async Task<RoleResult> UpdateRoleAsync(string roleName, AuthRoleUpdate request, CancellationToken token = default)
    {
        var success = await authRoleRepository.UpdateRoleAsync(roleName, request, token);

        if (!success)
            return new NotFound();

        var authRole = await authRoleRepository.GetRoleByNameAsync(roleName, token);
        return authRole is null ? new Error<string>("Role not found after update") : authRole;
    }

    public async Task<AuthRoleDeletionResult> DeleteRoleAsync(string roleName, CancellationToken token = default)
    {
        var success = await authRoleRepository.DeleteRoleAsync(roleName, token);

        return success ? new Success() : new Error<string>("Failed to delete role.");
    }

    public async Task<RolesResult> GetRolesByUserIdAsync(Guid userId, CancellationToken token = default)
    {
        var authRoles = await authRoleRepository.GetRolesByUserIdAsync(userId, token);

        return authRoles.ToList();
    }

    public async Task<AuthRoleAssignmentResult> AddRoleToUserAsync(Guid userId, string roleName, CancellationToken token = default)
    {
        var authRole = await authRoleRepository.GetRoleByNameAsync(roleName, token);
        if (authRole is null)
            return new NotFound();

        var success = await authRoleRepository.AddRoleToUserAsync(userId, roleName, token);

        return success ? authRole : new AlreadyExists();
    }

    public async Task<AuthRoleUnassignmentResult> RemoveRoleFromUserAsync(Guid userId, string roleName, CancellationToken token = default)
    {
        var success = await authRoleRepository.RemoveRoleFromUserAsync(userId, roleName, token);

        return success ? new Success() : new NotFound();
    }
}