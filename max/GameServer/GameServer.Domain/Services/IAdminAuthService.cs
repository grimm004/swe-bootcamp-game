using GameServer.Domain.Models;
using OneOf;
using OneOf.Types;

namespace GameServer.Domain.Services;

public interface IAdminAuthService
{
    Task<AuthRoleCreationResult> CreateRoleAsync(NewAuthRole role, CancellationToken token = default);
    Task<RolesResult> GetRolesAsync(CancellationToken token = default);
    Task<RoleResult> GetRoleByIdAsync(Guid roleId, CancellationToken token = default);
    Task<RoleResult> UpdateRoleAsync(Guid roleId, AuthRoleUpdate request, CancellationToken token = default);
    Task<AuthRoleDeletionResult> DeleteRoleAsync(Guid roleId, CancellationToken token = default);
    Task<RolesResult> GetRolesByUserIdAsync(Guid userId, CancellationToken token = default);
    Task<AuthRoleAssignmentResult> AddRoleToUserAsync(Guid userId, Guid roleId, CancellationToken token = default);
    Task<AuthRoleUnassignmentResult> RemoveRoleFromUserAsync(Guid userId, Guid roleId, CancellationToken token = default);
}

[GenerateOneOf]
public partial class AuthRoleCreationResult : OneOfBase<AuthRole, AlreadyExists, Error<string>>;

[GenerateOneOf]
public partial class AuthRoleDeletionResult : OneOfBase<Success, AlreadyExists, Error<string>>;

[GenerateOneOf]
public partial class AuthRoleAssignmentResult : OneOfBase<AuthRole, NotFound, AlreadyExists, Error<string>>;

[GenerateOneOf]
public partial class AuthRoleUnassignmentResult : OneOfBase<Success, NotFound, Error<string>>;

[GenerateOneOf]
public partial class RoleResult : OneOfBase<AuthRole, NotFound, Error<string>>;

[GenerateOneOf]
public partial class RolesResult : OneOfBase<List<AuthRole>, NotFound, Error<string>>;