using GameServer.Domain.Models;
using GameServer.Domain.Repositories;
using GameServer.Domain.Services.Implementation;

namespace GameServer.Tests.Unit.Domain.Services;

[TestFixture]
[TestOf(typeof(AdminAuthService))]
public class AdminAuthServiceTests
{
    private Mock<IUserRepository> _userRepository;
    private Mock<IAuthRoleRepository> _authRoleRepository;
    private AdminAuthService _adminAuthService;

    [SetUp]
    public void Setup()
    {
        _userRepository = new Mock<IUserRepository>();
        _authRoleRepository = new Mock<IAuthRoleRepository>();
        _adminAuthService = new AdminAuthService(_userRepository.Object, _authRoleRepository.Object);
    }

    [Test]
    public async Task CreateRoleAsync_ShouldReturnAlreadyExists_WhenRoleAlreadyExists()
    {
        // Arrange
        var newRole = new NewAuthRole { Name = "admin", Description = "Administrator role" };

        _authRoleRepository.Setup(repo => repo.CreateRoleAsync(newRole, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AuthRole?)null);

        // Act
        var result = await _adminAuthService.CreateRoleAsync(newRole);

        // Assert
        result.IsT1.Should().BeTrue();
    }

    [Test]
    public async Task CreateRoleAsync_ShouldReturnAuthRole_WhenRoleCreatedSuccessfully()
    {
        // Arrange
        var newRole = new NewAuthRole { Name = "admin", Description = "Administrator role" };
        var createdRole = new AuthRole { Name = "admin", Description = "Administrator role" };

        _authRoleRepository.Setup(repo => repo.CreateRoleAsync(newRole, It.IsAny<CancellationToken>()))
            .ReturnsAsync(createdRole);

        // Act
        var result = await _adminAuthService.CreateRoleAsync(newRole);

        // Assert
        result.IsT0.Should().BeTrue();
        result.AsT0.Should().BeEquivalentTo(createdRole);
    }

    [Test]
    public async Task GetRolesAsync_ShouldReturnListOfRoles()
    {
        // Arrange
        var roles = new List<AuthRole>
        {
            new() { Name = "admin", Description = "Administrator role" },
            new() { Name = "user", Description = "User role" }
        };

        _authRoleRepository.Setup(repo => repo.GetRolesAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(roles);

        // Act
        var result = await _adminAuthService.GetRolesAsync();

        // Assert
        result.IsT0.Should().BeTrue();
        result.AsT0.Should().BeEquivalentTo(roles);
    }

    [Test]
    public async Task GetRoleByIdAsync_ShouldReturnNotFound_WhenRoleDoesNotExist()
    {
        // Arrange
        const string roleName = "nonexistent";

        _authRoleRepository.Setup(repo => repo.GetRoleByNameAsync(roleName, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AuthRole?)null);

        // Act
        var result = await _adminAuthService.GetRoleByIdAsync(roleName);

        // Assert
        result.IsT1.Should().BeTrue();
    }

    [Test]
    public async Task GetRoleByIdAsync_ShouldReturnAuthRole_WhenRoleExists()
    {
        // Arrange
        const string roleName = "admin";
        var role = new AuthRole { Name = "admin", Description = "Administrator role" };

        _authRoleRepository.Setup(repo => repo.GetRoleByNameAsync(roleName, It.IsAny<CancellationToken>()))
            .ReturnsAsync(role);

        // Act
        var result = await _adminAuthService.GetRoleByIdAsync(roleName);

        // Assert
        result.IsT0.Should().BeTrue();
        result.AsT0.Should().BeEquivalentTo(role);
    }

    [Test]
    public async Task UpdateRoleAsync_ShouldReturnNotFound_WhenRoleDoesNotExist()
    {
        // Arrange
        const string roleName = "nonexistent";
        var updateRequest = new AuthRoleUpdate { Description = "Updated description" };

        _authRoleRepository.Setup(repo => repo.UpdateRoleAsync(roleName, updateRequest, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _adminAuthService.UpdateRoleAsync(roleName, updateRequest);

        // Assert
        result.IsT1.Should().BeTrue();
    }

    [Test]
    public async Task UpdateRoleAsync_ShouldReturnError_WhenRoleNotFoundAfterUpdate()
    {
        // Arrange
        const string roleName = "admin";
        var updateRequest = new AuthRoleUpdate { Description = "Updated description" };

        _authRoleRepository.Setup(repo => repo.UpdateRoleAsync(roleName, updateRequest, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _authRoleRepository.Setup(repo => repo.GetRoleByNameAsync(roleName, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AuthRole?)null);

        // Act
        var result = await _adminAuthService.UpdateRoleAsync(roleName, updateRequest);

        // Assert
        result.IsT2.Should().BeTrue();
    }

    [Test]
    public async Task UpdateRoleAsync_ShouldReturnAuthRole_WhenRoleUpdatedSuccessfully()
    {
        // Arrange
        const string roleName = "admin";
        var updateRequest = new AuthRoleUpdate { Description = "Updated description" };
        var updatedRole = new AuthRole { Name = "admin", Description = "Updated description" };

        _authRoleRepository.Setup(repo => repo.UpdateRoleAsync(roleName, updateRequest, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _authRoleRepository.Setup(repo => repo.GetRoleByNameAsync(roleName, It.IsAny<CancellationToken>()))
            .ReturnsAsync(updatedRole);

        // Act
        var result = await _adminAuthService.UpdateRoleAsync(roleName, updateRequest);

        // Assert
        result.IsT0.Should().BeTrue();
        result.AsT0.Should().BeEquivalentTo(updatedRole);
    }

    [Test]
    public async Task DeleteRoleAsync_ShouldReturnError_WhenRoleDeletionFails()
    {
        // Arrange
        const string roleName = "admin";

        _authRoleRepository.Setup(repo => repo.DeleteRoleAsync(roleName, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _adminAuthService.DeleteRoleAsync(roleName);

        // Assert
        result.IsT2.Should().BeTrue();
    }

    [Test]
    public async Task DeleteRoleAsync_ShouldReturnSuccess_WhenRoleDeletedSuccessfully()
    {
        // Arrange
        const string roleName = "admin";

        _authRoleRepository.Setup(repo => repo.DeleteRoleAsync(roleName, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _adminAuthService.DeleteRoleAsync(roleName);

        // Assert
        result.IsT0.Should().BeTrue();
    }

    [Test]
    public async Task GetRolesByUserIdAsync_ShouldReturnNotFound_WhenUserDoesNotExist()
    {
        // Arrange
        var userId = Guid.NewGuid();

        _userRepository.Setup(repo => repo.GetUserByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _adminAuthService.GetRolesByUserIdAsync(userId);

        // Assert
        result.IsT1.Should().BeTrue();
    }

    [Test]
    public async Task GetRolesByUserIdAsync_ShouldReturnListOfRoles_WhenUserExists()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var user = new User { Id = userId, Roles = [] };
        var roles = new List<AuthRole>
        {
            new() { Name = "admin", Description = "Administrator role" },
            new() { Name = "user", Description = "User role" }
        };

        _userRepository.Setup(repo => repo.GetUserByIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);
        _authRoleRepository.Setup(repo => repo.GetRolesByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(roles);

        // Act
        var result = await _adminAuthService.GetRolesByUserIdAsync(userId);

        // Assert
        result.IsT0.Should().BeTrue();
        result.AsT0.Should().BeEquivalentTo(roles);
    }

    [Test]
    public async Task AddRoleToUserAsync_ShouldReturnNotFound_WhenRoleDoesNotExist()
    {
        // Arrange
        var userId = Guid.NewGuid();
        const string roleName = "nonexistent";

        _authRoleRepository.Setup(repo => repo.GetRoleByNameAsync(roleName, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AuthRole?)null);

        // Act
        var result = await _adminAuthService.AddRoleToUserAsync(userId, roleName);

        // Assert
        result.IsT1.Should().BeTrue();
    }

    [Test]
    public async Task AddRoleToUserAsync_ShouldReturnAlreadyExists_WhenRoleAlreadyAssigned()
    {
        // Arrange
        var userId = Guid.NewGuid();
        const string roleName = "admin";
        var role = new AuthRole { Name = "admin", Description = "Administrator role" };

        _authRoleRepository.Setup(repo => repo.GetRoleByNameAsync(roleName, It.IsAny<CancellationToken>()))
            .ReturnsAsync(role);
        _authRoleRepository.Setup(repo => repo.AddRoleToUserAsync(userId, roleName, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _adminAuthService.AddRoleToUserAsync(userId, roleName);

        // Assert
        result.IsT2.Should().BeTrue();
    }

    [Test]
    public async Task AddRoleToUserAsync_ShouldReturnAuthRole_WhenRoleAssignedSuccessfully()
    {
        // Arrange
        var userId = Guid.NewGuid();
        const string roleName = "admin";
        var role = new AuthRole { Name = "admin", Description = "Administrator role" };

        _authRoleRepository.Setup(repo => repo.GetRoleByNameAsync(roleName, It.IsAny<CancellationToken>()))
            .ReturnsAsync(role);
        _authRoleRepository.Setup(repo => repo.AddRoleToUserAsync(userId, roleName, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _adminAuthService.AddRoleToUserAsync(userId, roleName);

        // Assert
        result.IsT0.Should().BeTrue();
        result.AsT0.Should().BeEquivalentTo(role);
    }

    [Test]
    public async Task RemoveRoleFromUserAsync_ShouldReturnNotFound_WhenRoleDoesNotExist()
    {
        // Arrange
        var userId = Guid.NewGuid();
        const string roleName = "nonexistent";

        _authRoleRepository.Setup(repo => repo.GetRoleByNameAsync(roleName, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AuthRole?)null);

        // Act
        var result = await _adminAuthService.RemoveRoleFromUserAsync(userId, roleName);

        // Assert
        result.IsT1.Should().BeTrue();
    }

    [Test]
    public async Task RemoveRoleFromUserAsync_ShouldReturnNotFound_WhenRoleNotAssigned()
    {
        // Arrange
        var userId = Guid.NewGuid();
        const string roleName = "admin";

        _authRoleRepository.Setup(repo => repo.RemoveRoleFromUserAsync(userId, roleName, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _adminAuthService.RemoveRoleFromUserAsync(userId, roleName);

        // Assert
        result.IsT1.Should().BeTrue();
    }
}