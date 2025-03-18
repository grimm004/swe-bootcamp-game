using GameServer.Data.Entities;
using GameServer.Data.Mappers;

namespace GameServer.Tests.Unit.Data.Mappers;

[TestFixture]
[TestOf(typeof(DomainMappers))]
public class DomainMappersTests
{
    [Test]
    public void MapToAuthRole_WithAuthRole_ReturnsMappedAuthRole()
    {
        // Arrange
        var authRole = new AuthRole
        {
            Name = "Admin",
            Description = "Administrator role"
        };

        // Act
        var result = authRole.MapToAuthRole();

        // Assert
        result.Name.Should().Be(authRole.Name);
        result.Description.Should().Be(authRole.Description);
    }

    [Test]
    public void MapToUser_WithUser_ReturnsMappedUser()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "testuser",
            DisplayName = "Test User",
            AuthCredentials = new UserAuthCredentials
            {
                PasswordSalt = [1, 2, 3, 4],
                PasswordHash = [5, 6, 7, 8]
            },
            Roles =
            [
                new AuthRole
                {
                    Name = "admin",
                    Description = "Administrator role"
                }
            ]
        };

        // Act
        var result = user.MapToUser();

        // Assert
        result.Id.Should().Be(user.Id);
        result.Username.Should().Be(user.Username);
        result.DisplayName.Should().Be(user.DisplayName);
        result.PasswordSalt.Should().BeEquivalentTo(user.AuthCredentials.PasswordSalt);
        result.PasswordHash.Should().BeEquivalentTo(user.AuthCredentials.PasswordHash);
        result.Roles.Should().ContainSingle();
        result.Roles.Single().Should().Be(user.Roles.Single().Name);
    }

    [Test]
    public void MapToAuthSessionInfo_WithAuthSession_ReturnsMappedAuthSessionInfo()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "testuser",
            DisplayName = "Test User",
            Roles =
            [
                new AuthRole
                {
                    Name = "admin",
                    Description = "Administrator role"
                }
            ],
            AuthCredentials = new UserAuthCredentials
            {
                PasswordSalt = [1, 2, 3, 4],
                PasswordHash = [5, 6, 7, 8]
            }
        };

        var authSession = new AuthSession
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            User = user,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            RevokedAt = null,
            TokenHash = [1, 2, 3, 4]
        };

        // Act
        var result = authSession.MapToAuthSessionInfo();

        // Assert
        result.Id.Should().Be(authSession.Id);
        result.User.Should().NotBeNull();
        result.User.Id.Should().Be(authSession.User!.Id);
        result.CreatedAt.Should().BeCloseTo(authSession.CreatedAt, TimeSpan.FromSeconds(1));
        result.ExpiresAt.Should().BeCloseTo(authSession.ExpiresAt, TimeSpan.FromSeconds(1));
        result.RevokedAt.Should().BeNull();
    }

    [TestCase(LobbyStatus.Closed, GameServer.Domain.Models.LobbyStatus.Closed)]
    [TestCase(LobbyStatus.Open, GameServer.Domain.Models.LobbyStatus.Open)]
    [TestCase(LobbyStatus.InGame, GameServer.Domain.Models.LobbyStatus.InGame)]
    public void MapToLobby_WithLobby_ReturnsMappedLobby(int lobbyStatus,
        GameServer.Domain.Models.LobbyStatus expectedStatus)
    {
        // Arrange
        var playerRole = new AuthRole
        {
            Name = "player",
            Description = "Player role"
        };

        var host = new User
        {
            Id = Guid.NewGuid(),
            Username = "hostuser",
            DisplayName = "Host User",
            Roles = [playerRole],
            AuthCredentials = new UserAuthCredentials
            {
                PasswordSalt = [1, 2, 3, 4],
                PasswordHash = [5, 6, 7, 8]
            }
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "testuser",
            DisplayName = "Test User",
            Roles = [playerRole],
            AuthCredentials = new UserAuthCredentials
            {
                PasswordSalt = [8, 7, 6, 5],
                PasswordHash = [4, 3, 2, 1]
            }
        };

        var lobby = new Lobby
        {
            Id = Guid.NewGuid(),
            HostId = host.Id,
            JoinCode = "ABC123",
            Status = (LobbyStatus)lobbyStatus,
            Users =
            [
                host,
                user
            ]
        };

        // Act
        var result = lobby.MapToLobby();

        // Assert
        result.Id.Should().Be(lobby.Id);
        result.HostId.Should().Be(host.Id);
        result.JoinCode.Should().Be(lobby.JoinCode);
        result.Status.Should().Be(expectedStatus);
        result.Users.Should().HaveCount(2);
        result.Users.First().Id.Should().Be(host.Id);
        result.Users.Last().Id.Should().Be(user.Id);
    }

    [Test]
    public void MapToLobby_WithInvalidStatus_ThrowsException()
    {
        // Arrange
        var host = new User
        {
            Id = Guid.NewGuid(),
            Username = "hostuser",
            DisplayName = "Host User"
        };

        var lobby = new Lobby
        {
            Id = Guid.NewGuid(),
            HostId = host.Id,
            JoinCode = "ABC123",
            Status = (LobbyStatus) 123,
            Users = [host]
        };

        // Act
        var resultAction = () => lobby.MapToLobby();

        // Assert
        resultAction.Should().Throw<ArgumentOutOfRangeException>();
    }
}