using GameServer.Api.Contracts.Requests;
using GameServer.Api.Mappers;
using GameServer.Domain.Models;

namespace GameServer.Tests.Unit.Api.Mappers;

[TestFixture]
[TestOf(typeof(AuthMappers))]
public class AuthMappersTests
{
    [Test]
    public void MapToAuthRegistration_WithRegisterRequest_DirectlyMapsProperties()
    {
        // Arrange
        var request = new RegisterRequest("testuser", "password123", "Test User");

        // Act
        var result = request.MapToAuthRegistration();

        // Assert
        result.Username.Should().Be(request.Username);
        result.DisplayName.Should().Be(request.DisplayName);
        result.Password.Should().Be(request.Password);
    }

    [Test]
    public void MapToAuthCredentials_WithLoginRequest_DirectlyMapsProperties()
    {
        // Arrange
        var request = new LoginRequest("testuser", "password123");

        // Act
        var result = request.MapToAuthCredentials();

        // Assert
        result.Username.Should().Be(request.Username);
        result.Password.Should().Be(request.Password);
    }

    [Test]
    public void MapToUserUpdate_WithUpdateUserRequest_DirectlyMapsProperties()
    {
        // Arrange
        var request = new UpdateUserRequest("Test User");

        // Act
        var result = request.MapToUserUpdate();

        // Assert
        result.DisplayName.Should().Be(request.DisplayName);
    }

    [Test]
    public void MapToResponse_WithUser_MapsCorrectProperties()
    {
        // Arrange
        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = "testuser",
            DisplayName = "Test User",
            Roles = ["User", "Admin"],
            PasswordHash = [],
            PasswordSalt = []
        };

        // Act
        var result = user.MapToResponse();

        // Assert
        result.Id.Should().Be(user.Id);
        result.Username.Should().Be(user.Username);
        result.DisplayName.Should().Be(user.DisplayName);
        result.Roles.Should().BeEquivalentTo(user.Roles);
    }

    [Test]
    public void MapToResponse_WithAuthSession_MapsCorrectProperties()
    {
        // Arrange
        var tokenData = new byte[32];
        Random.Shared.NextBytes(tokenData);

        var session = new AuthSession
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            TokenData = tokenData,
            User = new User
            {
                Id = Guid.NewGuid(),
                Username = "testuser",
                DisplayName = "Test User",
                Roles = ["User", "Admin"],
                PasswordHash = [],
                PasswordSalt = []
            }
        };

        // Act
        var result = session.MapToResponse();

        // Assert
        result.ExpiresAt.Should().Be(session.ExpiresAt);

        result.User.Id.Should().Be(session.User.Id);
        result.User.Username.Should().Be(session.User.Username);
        result.User.DisplayName.Should().Be(session.User.DisplayName);
        result.User.Roles.Should().BeEquivalentTo(session.User.Roles);

        var resultData = new byte[32];
        Convert.TryFromBase64String(result.Token, resultData, out var bytesWritten).Should().BeTrue();
        bytesWritten.Should().Be(tokenData.Length);
        resultData.Should().BeEquivalentTo(tokenData);
    }

    [Test]
    public void MapToResponse_WithAuthSessionInfo_MapsCorrectProperties()
    {
        // Arrange
        var tokenData = new byte[32];
        Random.Shared.NextBytes(tokenData);

        var sessionInfo = new AuthSessionInfo
        {
            Id = Guid.NewGuid(),
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(1),
            User = new User
            {
                Id = Guid.NewGuid(),
                Username = "testuser",
                DisplayName = "Test User",
                Roles = ["User", "Admin"],
                PasswordHash = [],
                PasswordSalt = []
            }
        };

        // Act
        var result = sessionInfo.MapToResponse();

        // Assert
        result.ExpiresAt.Should().Be(sessionInfo.ExpiresAt);

        result.User.Id.Should().Be(sessionInfo.User.Id);
        result.User.Username.Should().Be(sessionInfo.User.Username);
        result.User.DisplayName.Should().Be(sessionInfo.User.DisplayName);
        result.User.Roles.Should().BeEquivalentTo(sessionInfo.User.Roles);
    }
}