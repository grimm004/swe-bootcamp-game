using GameServer.Domain.Models;
using GameServer.Domain.Repositories;
using GameServer.Domain.Services;
using GameServer.Domain.Services.Implementation;

namespace GameServer.Tests.Unit.Domain.Services;

[TestFixture]
[TestOf(typeof(AuthService))]
public class AuthServiceTests
{
    private Mock<IUserRepository> _userRepository;
    private Mock<IAuthSessionRepository> _sessionRepository;
    private Mock<IAuthRoleRepository> _roleRepository;
    private Mock<ISaltedHashService> _saltedHashService;
    private AuthService _authService;

    [SetUp]
    public void Setup()
    {
        _userRepository = new Mock<IUserRepository>();
        _sessionRepository = new Mock<IAuthSessionRepository>();
        _roleRepository = new Mock<IAuthRoleRepository>();
        _saltedHashService = new Mock<ISaltedHashService>();

        _authService = new AuthService(
            _userRepository.Object,
            _sessionRepository.Object,
            _roleRepository.Object,
            _saltedHashService.Object);
    }

    [Test]
    public async Task RegisterAsync_UserAlreadyExists_ReturnsAlreadyExists()
    {
        // Arrange
        var registration = new AuthRegistration
        {
            Username = "username",
            Password = "password",
            DisplayName = "displayName"
        };

        _userRepository.Setup(repo => repo.GetUserByUsernameAsync(registration.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User());

        // Act
        var result = await _authService.RegisterAsync(registration, [], CancellationToken.None);

        // Assert
        result.IsT1.Should().BeTrue();
    }

    [Test]
    public async Task RegisterAsync_UserCreationFails_ReturnsError()
    {
        // Arrange
        var registration = new AuthRegistration
        {
            Username = "username",
            Password = "password",
            DisplayName = "displayName"
        };

        _userRepository.Setup(repo => repo.GetUserByUsernameAsync(registration.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        _userRepository.Setup(repo => repo.CreateUserAsync(
                registration.Username,
                It.IsAny<byte[]>(),
                It.IsAny<byte[]>(),
                registration.DisplayName,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _authService.RegisterAsync(registration, [], CancellationToken.None);

        // Assert
        result.IsT2.Should().BeTrue();
    }

    [Test]
    public async Task RegisterAsync_UserDoesNotExist_CreatesAndReturnsUser()
    {
        // Arrange
        var registration = new AuthRegistration
        {
            Username = "username",
            Password = "password",
            DisplayName = "displayName"
        };

        var initialRoles = new List<string> { "role1", "role2" };

        _userRepository.Setup(repo => repo.GetUserByUsernameAsync(registration.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        _userRepository.Setup(repo => repo.CreateUserAsync(
                registration.Username,
                It.IsAny<byte[]>(),
                It.IsAny<byte[]>(),
                registration.DisplayName,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new User { Id = Guid.NewGuid(), Username = registration.Username, DisplayName = registration.DisplayName });

        _roleRepository.Setup(repo => repo.AddRoleToUserAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _authService.RegisterAsync(registration, initialRoles, CancellationToken.None);

        // Assert
        result.IsT0.Should().BeTrue();
        result.AsT0.Id.Should().NotBe(Guid.Empty);
        result.AsT0.Username.Should().Be(registration.Username);
        result.AsT0.DisplayName.Should().Be(registration.DisplayName);
        result.AsT0.Roles.Should().BeEquivalentTo(initialRoles);
    }

    [Test]
    public async Task LoginAsync_UserNotFound_ReturnsNotFound()
    {
        // Arrange
        var credentials = new AuthCredentials
        {
            Username = "username",
            Password = "password"
        };

        _userRepository.Setup(repo => repo.GetUserByUsernameAsync(credentials.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        // Act
        var result = await _authService.LoginAsync(credentials, CancellationToken.None);

        // Assert
        result.IsT1.Should().BeTrue();
    }

    [Test]
    public async Task LoginAsync_InvalidPassword_ReturnsNotFound()
    {
        // Arrange
        var credentials = new AuthCredentials
        {
            Username = "username",
            Password = "wrongPassword"
        };

        var passwordHash = new byte[64];
        passwordHash[0] = 1;

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = credentials.Username,
            PasswordSalt = new byte[8],
            PasswordHash = passwordHash
        };

        _userRepository.Setup(repo => repo.GetUserByUsernameAsync(credentials.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _saltedHashService.Setup(s => s.HashData(It.IsAny<byte[]>(), It.IsAny<byte[]>()))
            .Returns(new byte[64]);

        // Act
        var result = await _authService.LoginAsync(credentials, CancellationToken.None);

        // Assert
        result.IsT1.Should().BeTrue();
    }

    [Test]
    public async Task LoginAsync_ExistingSessionRevocationFails_ReturnsError()
    {
        // Arrange
        var credentials = new AuthCredentials
        {
            Username = "username",
            Password = "password"
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = credentials.Username,
            PasswordSalt = new byte[8],
            PasswordHash = new byte[64]
        };

        _userRepository.Setup(repo => repo.GetUserByUsernameAsync(credentials.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _saltedHashService.Setup(s => s.HashData(It.IsAny<byte[]>(), It.IsAny<byte[]>()))
            .Returns(new byte[64]);

        var existingSession = new AuthSessionInfo
        {
            Id = Guid.NewGuid()
        };

        _sessionRepository.Setup(repo => repo.GetActiveSessionsByUserAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync([existingSession]);

        _sessionRepository.Setup(repo => repo.RevokeSessionAsync(existingSession.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _authService.LoginAsync(credentials, CancellationToken.None);

        // Assert
        result.IsT2.Should().BeTrue();
    }

    [Test]
    public async Task LoginAsync_SessionCreationFails_ReturnsError()
    {
        // Arrange
        var credentials = new AuthCredentials
        {
            Username = "username",
            Password = "password"
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = credentials.Username,
            PasswordSalt = new byte[8],
            PasswordHash = new byte[64]
        };

        _userRepository.Setup(repo => repo.GetUserByUsernameAsync(credentials.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _saltedHashService.Setup(s => s.HashData(It.IsAny<byte[]>(), It.IsAny<byte[]>()))
            .Returns(new byte[64]);

        var existingSession = new AuthSessionInfo
        {
            Id = Guid.NewGuid()
        };

        _sessionRepository.Setup(repo => repo.GetActiveSessionsByUserAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync([existingSession]);

        _sessionRepository.Setup(repo => repo.RevokeSessionAsync(existingSession.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var authTokenData = new byte[32];
        var authTokenHash = new byte[64];

        _saltedHashService.Setup(s => s.GenerateRandomBytes(32))
            .Returns(authTokenData);

        _saltedHashService.Setup(s => s.HashData(It.IsAny<byte[]>(), null))
            .Returns(authTokenHash);

        _sessionRepository.Setup(repo => repo.CreateSessionAsync(user.Id, authTokenHash, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AuthSessionInfo?)null);

        // Act
        var result = await _authService.LoginAsync(credentials, CancellationToken.None);

        // Assert
        result.IsT2.Should().BeTrue();
    }

    [Test]
    public async Task LoginAsync_ValidCredentials_ReturnsAuthSession()
    {
        // Arrange
        var credentials = new AuthCredentials
        {
            Username = "username",
            Password = "password"
        };

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = credentials.Username,
            PasswordSalt = new byte[8],
            PasswordHash = new byte[64]
        };

        _userRepository.Setup(repo => repo.GetUserByUsernameAsync(credentials.Username, It.IsAny<CancellationToken>()))
            .ReturnsAsync(user);

        _saltedHashService.Setup(s => s.HashData(It.IsAny<byte[]>(), It.IsAny<byte[]>()))
            .Returns(new byte[64]);

        var existingSession = new AuthSessionInfo
        {
            Id = Guid.NewGuid()
        };

        _sessionRepository.Setup(repo => repo.GetActiveSessionsByUserAsync(user.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync([existingSession]);

        _sessionRepository.Setup(repo => repo.RevokeSessionAsync(existingSession.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        var authTokenData = new byte[32];
        var authTokenHash = new byte[64];

        _saltedHashService.Setup(s => s.GenerateRandomBytes(32))
            .Returns(authTokenData);

        _saltedHashService.Setup(s => s.HashData(It.IsAny<byte[]>(), null))
            .Returns(authTokenHash);

        var authSessionInfo = new AuthSessionInfo
        {
            Id = Guid.NewGuid(),
            User = user,
            CreatedAt = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        };

        _sessionRepository.Setup(repo => repo.CreateSessionAsync(user.Id, authTokenHash, It.IsAny<CancellationToken>()))
            .ReturnsAsync(authSessionInfo);

        // Act
        var result = await _authService.LoginAsync(credentials, CancellationToken.None);

        // Assert
        result.IsT0.Should().BeTrue();
        result.AsT0.Id.Should().Be(authSessionInfo.Id);
        result.AsT0.User.Should().BeEquivalentTo(user);
        result.AsT0.CreatedAt.Should().Be(authSessionInfo.CreatedAt);
        result.AsT0.ExpiresAt.Should().Be(authSessionInfo.ExpiresAt);
        result.AsT0.TokenData.Should().BeEquivalentTo(authTokenData);
    }

    [Test]
    public async Task LogoutAsync_SessionNotFound_ReturnsNotFound()
    {
        // Arrange
        var authTokenData = new byte[32];
        var authTokenHash = new byte[64];

        _saltedHashService.Setup(s => s.HashData(authTokenData, null))
            .Returns(authTokenHash);

        _sessionRepository.Setup(repo => repo.GetSessionByTokenHashAsync(authTokenHash, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AuthSessionInfo?)null);

        // Act
        var result = await _authService.LogoutAsync(authTokenData, CancellationToken.None);

        // Assert
        result.IsT1.Should().BeTrue();
    }

    [Test]
    public async Task LogoutAsync_RevocationFails_ReturnsError()
    {
        // Arrange
        var authTokenData = new byte[32];
        var authTokenHash = new byte[64];

        _saltedHashService.Setup(s => s.HashData(authTokenData, null))
            .Returns(authTokenHash);

        var session = new AuthSessionInfo
        {
            Id = Guid.NewGuid()
        };

        _sessionRepository.Setup(repo => repo.GetSessionByTokenHashAsync(authTokenHash, It.IsAny<CancellationToken>()))
            .ReturnsAsync(session);

        _sessionRepository.Setup(repo => repo.RevokeSessionAsync(session.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _authService.LogoutAsync(authTokenData, CancellationToken.None);

        // Assert
        result.IsT2.Should().BeTrue();
    }

    [Test]
    public async Task LogoutAsync_RevocationSucceeds_ReturnsSuccess()
    {
        // Arrange
        var authTokenData = new byte[32];
        var authTokenHash = new byte[64];

        _saltedHashService.Setup(s => s.HashData(authTokenData, null))
            .Returns(authTokenHash);

        var session = new AuthSessionInfo
        {
            Id = Guid.NewGuid()
        };

        _sessionRepository.Setup(repo => repo.GetSessionByTokenHashAsync(authTokenHash, It.IsAny<CancellationToken>()))
            .ReturnsAsync(session);

        _sessionRepository.Setup(repo => repo.RevokeSessionAsync(session.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _authService.LogoutAsync(authTokenData, CancellationToken.None);

        // Assert
        result.IsT0.Should().BeTrue();
    }

    [Test]
    public async Task GetSessionAsync_SessionNotFound_ReturnsUnauthorized()
    {
        // Arrange
        var authTokenData = new byte[32];
        var authTokenHash = new byte[64];

        _saltedHashService.Setup(s => s.HashData(authTokenData, null))
            .Returns(authTokenHash);

        _sessionRepository.Setup(repo => repo.GetSessionByTokenHashAsync(authTokenHash, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AuthSessionInfo?)null);

        // Act
        var result = await _authService.GetSessionAsync(authTokenData, CancellationToken.None);

        // Assert
        result.IsT1.Should().BeTrue();
    }

    [Test]
    public async Task GetSessionAsync_SessionRevoked_ReturnsUnauthorized()
    {
        // Arrange
        var authTokenData = new byte[32];
        var authTokenHash = new byte[64];

        _saltedHashService.Setup(s => s.HashData(authTokenData, null))
            .Returns(authTokenHash);

        var session = new AuthSessionInfo
        {
            Id = Guid.NewGuid(),
            RevokedAt = DateTime.UtcNow.AddHours(-1)
        };

        _sessionRepository.Setup(repo => repo.GetSessionByTokenHashAsync(authTokenHash, It.IsAny<CancellationToken>()))
            .ReturnsAsync(session);

        // Act
        var result = await _authService.GetSessionAsync(authTokenData, CancellationToken.None);

        // Assert
        result.IsT1.Should().BeTrue();
    }

    [Test]
    public async Task GetSessionAsync_SessionExpired_ReturnsUnauthorized()
    {
        // Arrange
        var authTokenData = new byte[32];
        var authTokenHash = new byte[64];

        _saltedHashService.Setup(s => s.HashData(authTokenData, null))
            .Returns(authTokenHash);

        var session = new AuthSessionInfo
        {
            Id = Guid.NewGuid(),
            ExpiresAt = DateTime.UtcNow.AddHours(-1)
        };

        _sessionRepository.Setup(repo => repo.GetSessionByTokenHashAsync(authTokenHash, It.IsAny<CancellationToken>()))
            .ReturnsAsync(session);

        // Act
        var result = await _authService.GetSessionAsync(authTokenData, CancellationToken.None);

        // Assert
        result.IsT1.Should().BeTrue();
    }

    [Test]
    public async Task GetSessionAsync_ValidSession_ReturnsSessionInfo()
    {
        // Arrange
        var authTokenData = new byte[32];
        var authTokenHash = new byte[64];

        _saltedHashService.Setup(s => s.HashData(authTokenData, null))
            .Returns(authTokenHash);

        var session = new AuthSessionInfo
        {
            Id = Guid.NewGuid(),
            ExpiresAt = DateTime.UtcNow.AddHours(1)
        };

        _sessionRepository.Setup(repo => repo.GetSessionByTokenHashAsync(authTokenHash, It.IsAny<CancellationToken>()))
            .ReturnsAsync(session);

        // Act
        var result = await _authService.GetSessionAsync(authTokenData, CancellationToken.None);

        // Assert
        result.IsT0.Should().BeTrue();
        result.AsT0.Should().BeEquivalentTo(session);
    }

    [Test]
    public async Task UpdateProfileAsync_SessionNotFound_ReturnsUnauthorized()
    {
        // Arrange
        var authTokenData = new byte[32];
        var authTokenHash = new byte[64];

        _saltedHashService.Setup(s => s.HashData(authTokenData, null))
            .Returns(authTokenHash);

        _sessionRepository.Setup(repo => repo.GetSessionByTokenHashAsync(authTokenHash, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AuthSessionInfo?)null);

        var userUpdate = new UserUpdate
        {
            DisplayName = "newDisplayName"
        };

        // Act
        var result = await _authService.UpdateProfileAsync(authTokenData, userUpdate, CancellationToken.None);

        // Assert
        result.IsT1.Should().BeTrue();
    }

    [Test]
    public async Task UpdateProfileAsync_UserNotFound_ReturnsUnauthorized()
    {
        // Arrange
        var authTokenData = new byte[32];
        var authTokenHash = new byte[64];

        _saltedHashService.Setup(s => s.HashData(authTokenData, null))
            .Returns(authTokenHash);

        var session = new AuthSessionInfo
        {
            Id = Guid.NewGuid(),
            User = new User { Id = Guid.NewGuid() }
        };

        _sessionRepository.Setup(repo => repo.GetSessionByTokenHashAsync(authTokenHash, It.IsAny<CancellationToken>()))
            .ReturnsAsync(session);

        _userRepository.Setup(repo => repo.UpdateUserAsync(session.User.Id, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var userUpdate = new UserUpdate
        {
            DisplayName = "newDisplayName"
        };

        // Act
        var result = await _authService.UpdateProfileAsync(authTokenData, userUpdate, CancellationToken.None);

        // Assert
        result.IsT2.Should().BeTrue();
    }

    [Test]
    public async Task UpdateProfileAsync_UpdateFails_ReturnsError()
    {
        // Arrange
        var authTokenData = new byte[32];
        var authTokenHash = new byte[64];

        _saltedHashService.Setup(s => s.HashData(authTokenData, null))
            .Returns(authTokenHash);

        var session = new AuthSessionInfo
        {
            Id = Guid.NewGuid(),
            User = new User { Id = Guid.NewGuid() }
        };

        _sessionRepository.Setup(repo => repo.GetSessionByTokenHashAsync(authTokenHash, It.IsAny<CancellationToken>()))
            .ReturnsAsync(session);

        _userRepository.Setup(repo => repo.UpdateUserAsync(session.User.Id, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((User?)null);

        var userUpdate = new UserUpdate
        {
            DisplayName = "newDisplayName"
        };

        // Act
        var result = await _authService.UpdateProfileAsync(authTokenData, userUpdate, CancellationToken.None);

        // Assert
        result.IsT2.Should().BeTrue();
    }

    [Test]
    public async Task UpdateProfileAsync_ValidUpdate_ReturnsUpdatedUser()
    {
        // Arrange
        var authTokenData = new byte[32];
        var authTokenHash = new byte[64];

        _saltedHashService.Setup(s => s.HashData(authTokenData, null))
            .Returns(authTokenHash);

        var session = new AuthSessionInfo
        {
            Id = Guid.NewGuid(),
            User = new User { Id = Guid.NewGuid() }
        };

        _sessionRepository.Setup(repo => repo.GetSessionByTokenHashAsync(authTokenHash, It.IsAny<CancellationToken>()))
            .ReturnsAsync(session);

        var updatedUser = new User
        {
            Id = session.User.Id,
            DisplayName = "newDisplayName"
        };

        _userRepository.Setup(repo => repo.UpdateUserAsync(session.User.Id, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(updatedUser);

        var userUpdate = new UserUpdate
        {
            DisplayName = "newDisplayName"
        };

        // Act
        var result = await _authService.UpdateProfileAsync(authTokenData, userUpdate, CancellationToken.None);

        // Assert
        result.IsT0.Should().BeTrue();
        result.AsT0.Should().BeEquivalentTo(updatedUser);
    }
}