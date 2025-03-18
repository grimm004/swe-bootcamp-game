using GameServer.Api.Contracts.Requests;
using GameServer.Api.Mappers;
using GameServer.Domain.Models;

namespace GameServer.Tests.Unit.Api.Mappers;

[TestFixture]
[TestOf(typeof(AuthRoleMappers))]
public class AuthRoleMappersTests
{
    [Test]
    public void MapToNewAuthRole_WithRegisterCreateAuthRoleRequest_DirectlyMapsProperties()
    {
        // Arrange
        var request = new CreateAuthRoleRequest("admin", "Administrator");

        // Act
        var result = request.MapToNewAuthRole();

        // Assert
        result.Name.Should().Be(request.Name);
        result.Description.Should().Be(request.Description);
    }

    [Test]
    public void MapToAuthRoleResponse_WithAuthRole_MapsCorrectProperties()
    {
        // Arrange
        var authRole = new AuthRole
        {
            Name = "admin",
            Description = "Administrator"
        };

        // Act
        var result = authRole.MapToAuthRoleResponse();

        // Assert
        result.Name.Should().Be(authRole.Name);
        result.Description.Should().Be(authRole.Description);
    }

    [Test]
    public void MapToAuthRoleUpdate_WithUpdateAuthRoleRequest_DirectlyMapsProperties()
    {
        // Arrange
        var request = new UpdateAuthRoleRequest("admin", "Administrator");

        // Act
        var result = request.MapToAuthRoleUpdate();

        // Assert
        result.Name.Should().Be(request.Name);
        result.Description.Should().Be(request.Description);
    }
}