using GameServer.Api.Mappers;
using GameServer.Domain.Models;

namespace GameServer.Tests.Unit.Api.Mappers;

[TestFixture]
[TestOf(typeof(LobbyMappers))]
public class LobbyMappersTests
{
    [Test]
    public void MapToResponse_WithLobby_MapsCorrectProperties()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "testuser",
            DisplayName = "Test User",
            Roles = ["admin", "player"],
            PasswordHash = [],
            PasswordSalt = []
        };

        var lobby = new Lobby
        {
            Id = Guid.NewGuid(),
            JoinCode = "123ABC",
            HostId = Guid.NewGuid(),
            Status = LobbyStatus.Open,
            Users = [user]
        };

        // Act
        var result = lobby.MapToResponse();

        // Assert
        result.Id.Should().Be(lobby.Id);
        result.JoinCode.Should().Be(lobby.JoinCode);
        result.HostId.Should().Be(lobby.HostId);

        result.Users.Should().HaveCount(1);
        var userResult = result.Users.Single();
        userResult.Id.Should().Be(user.Id);
        userResult.Username.Should().Be(user.Username);
        userResult.DisplayName.Should().Be(user.DisplayName);
    }
}