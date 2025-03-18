using GameServer.Domain.Models;
using GameServer.Domain.Repositories;
using GameServer.Domain.Services.Implementation;

namespace GameServer.Tests.Unit.Domain.Services;

[TestFixture]
[TestOf(typeof(LobbyService))]
public class LobbyServiceTests
{
    private Mock<ILobbyRepository> _lobbyRepository;
    private LobbyService _lobbyService;

    [SetUp]
    public void Setup()
    {
        _lobbyRepository = new Mock<ILobbyRepository>();
        _lobbyService = new LobbyService(_lobbyRepository.Object);
    }

    [Test]
    public async Task CreateLobbyAsync_ShouldReturnError_WhenExistingLobbyCannotBeDeleted()
    {
        // Arrange
        var hostId = Guid.NewGuid();
        var existingLobby = new Lobby { Id = Guid.NewGuid(), HostId = hostId };
        _lobbyRepository.Setup(repo => repo.GetLobbyByHostIdAsync(hostId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingLobby);
        _lobbyRepository.Setup(repo => repo.DeleteLobbyAsync(existingLobby.Id, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _lobbyService.CreateLobbyAsync(hostId);

        // Assert
        result.IsT1.Should().BeTrue();
    }

    [Test]
    public async Task CreateLobbyAsync_ShouldReturnError_WhenLobbyCreationFails()
    {
        // Arrange
        var hostId = Guid.NewGuid();

        _lobbyRepository.Setup(repo => repo.GetLobbyByHostIdAsync(hostId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Lobby?)null);
        _lobbyRepository.Setup(repo => repo.CreateLobbyAsync(hostId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((Lobby?)null);

        // Act
        var result = await _lobbyService.CreateLobbyAsync(hostId);

        // Assert
        result.IsT1.Should().BeTrue();
    }

    [Test]
    public async Task CreateLobbyAsync_ShouldReturnLobby_WhenSuccessful()
    {
        // Arrange
        var hostId = Guid.NewGuid();
        const string joinCode = "ABC123";
        var lobby = new Lobby { Id = Guid.NewGuid(), HostId = hostId, JoinCode = joinCode };

        _lobbyRepository.Setup(repo => repo.GetLobbyByHostIdAsync(hostId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Lobby?)null);
        _lobbyRepository.Setup(repo => repo.CreateLobbyAsync(hostId, It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(lobby);

        // Act
        var result = await _lobbyService.CreateLobbyAsync(hostId);

        // Assert
        result.IsT0.Should().BeTrue();
        result.AsT0.Should().BeEquivalentTo(lobby);
    }

    [Test]
    public async Task GetLobbyByJoinCodeAsync_ShouldReturnNotFound_WhenLobbyDoesNotExist()
    {
        // Arrange
        const string joinCode = "ABC123";

        _lobbyRepository.Setup(repo => repo.GetLobbyByJoinCodeAsync(joinCode, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Lobby?)null);

        // Act
        var result = await _lobbyService.GetLobbyByJoinCodeAsync(joinCode);

        // Assert
        result.IsT1.Should().BeTrue();
    }

    [Test]
    public async Task GetLobbyByJoinCodeAsync_ShouldReturnLobby_WhenSuccessful()
    {
        // Arrange
        const string joinCode = "ABC123";
        var lobby = new Lobby { Id = Guid.NewGuid(), JoinCode = joinCode };

        _lobbyRepository.Setup(repo => repo.GetLobbyByJoinCodeAsync(joinCode, It.IsAny<CancellationToken>()))
            .ReturnsAsync(lobby);

        // Act
        var result = await _lobbyService.GetLobbyByJoinCodeAsync(joinCode);

        // Assert
        result.IsT0.Should().BeTrue();
        result.AsT0.Should().BeEquivalentTo(lobby);
    }

    [Test]
    public async Task GetLobbyByIdAsync_ShouldReturnNotFound_WhenLobbyDoesNotExist()
    {
        // Arrange
        var lobbyId = Guid.NewGuid();

        _lobbyRepository.Setup(repo => repo.GetLobbyByIdAsync(lobbyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Lobby?)null);

        // Act
        var result = await _lobbyService.GetLobbyByIdAsync(lobbyId);

        // Assert
        result.IsT1.Should().BeTrue();
    }

    [Test]
    public async Task GetLobbyByIdAsync_ShouldReturnLobby_WhenSuccessful()
    {
        // Arrange
        var lobbyId = Guid.NewGuid();
        var lobby = new Lobby { Id = lobbyId };

        _lobbyRepository.Setup(repo => repo.GetLobbyByIdAsync(lobbyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(lobby);

        // Act
        var result = await _lobbyService.GetLobbyByIdAsync(lobbyId);

        // Assert
        result.IsT0.Should().BeTrue();
        result.AsT0.Should().BeEquivalentTo(lobby);
    }

    [Test]
    public async Task DisbandLobbyAsync_ShouldReturnNotFound_WhenLobbyDoesNotExist()
    {
        // Arrange
        var lobbyId = Guid.NewGuid();

        _lobbyRepository.Setup(repo => repo.GetLobbyByIdAsync(lobbyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Lobby?)null);

        // Act
        var result = await _lobbyService.DisbandLobbyAsync(lobbyId);

        // Assert
        result.IsT1.Should().BeTrue();
    }

    [Test]
    public async Task DisbandLobbyAsync_ShouldReturnError_WhenLobbyDeletionFails()
    {
        // Arrange
        var lobbyId = Guid.NewGuid();
        var lobby = new Lobby { Id = lobbyId };

        _lobbyRepository.Setup(repo => repo.GetLobbyByIdAsync(lobbyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(lobby);
        _lobbyRepository.Setup(repo => repo.DeleteLobbyAsync(lobbyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        // Act
        var result = await _lobbyService.DisbandLobbyAsync(lobbyId);

        // Assert
        result.IsT2.Should().BeTrue();
    }

    [Test]
    public async Task DisbandLobbyAsync_ShouldReturnSuccess_WhenSuccessful()
    {
        // Arrange
        var lobbyId = Guid.NewGuid();
        var lobby = new Lobby { Id = lobbyId };

        _lobbyRepository.Setup(repo => repo.GetLobbyByIdAsync(lobbyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(lobby);
        _lobbyRepository.Setup(repo => repo.DeleteLobbyAsync(lobbyId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        // Act
        var result = await _lobbyService.DisbandLobbyAsync(lobbyId);

        // Assert
        result.IsT0.Should().BeTrue();
    }

    [Test]
    public async Task JoinLobbyAsync_ShouldReturnError_WhenLeavingExistingLobbyFails()
    {
        // Arrange
        var userId = Guid.NewGuid();
        const string joinCode = "ABC123";
        var existingLobby = new Lobby { Id = Guid.NewGuid(), HostId = userId };

        _lobbyRepository.Setup(repo => repo.UserIsInLobbyAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        _lobbyRepository.Setup(repo => repo.GetLobbyByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingLobby);
        _lobbyRepository.Setup(repo => repo.RemoveUserFromLobbyAsync(existingLobby.Id, userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Lobby?)null);

        // Act
        var result = await _lobbyService.JoinLobbyAsync(userId, joinCode);

        // Assert
        result.IsT4.Should().BeTrue();
    }

    [Test]
    public async Task JoinLobbyAsync_ShouldReturnInvalidJoinCode_WhenLobbyDoesNotExist()
    {
        // Arrange
        var userId = Guid.NewGuid();
        const string joinCode = "ABC123";

        _lobbyRepository.Setup(repo => repo.UserIsInLobbyAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _lobbyRepository.Setup(repo => repo.GetLobbyByJoinCodeAsync(joinCode, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Lobby?)null);

        // Act
        var result = await _lobbyService.JoinLobbyAsync(userId, joinCode);

        // Assert
        result.IsT3.Should().BeTrue();
    }

    [Test]
    public async Task JoinLobbyAsync_ShouldReturnLobbyClosed_WhenLobbyIsNotOpen()
    {
        // Arrange
        var userId = Guid.NewGuid();
        const string joinCode = "ABC123";
        var lobby = new Lobby { Id = Guid.NewGuid(), HostId = Guid.NewGuid(), Status = LobbyStatus.Closed };

        _lobbyRepository.Setup(repo => repo.UserIsInLobbyAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _lobbyRepository.Setup(repo => repo.GetLobbyByJoinCodeAsync(joinCode, It.IsAny<CancellationToken>()))
            .ReturnsAsync(lobby);

        // Act
        var result = await _lobbyService.JoinLobbyAsync(userId, joinCode);

        // Assert
        result.IsT2.Should().BeTrue();
    }

    [Test]
    public async Task JoinLobbyAsync_ShouldReturnLobby_WhenSuccessful()
    {
        // Arrange
        var userId = Guid.NewGuid();
        const string joinCode = "ABC123";
        var lobby = new Lobby { Id = Guid.NewGuid(), HostId = Guid.NewGuid(), Status = LobbyStatus.Open };

        _lobbyRepository.Setup(repo => repo.UserIsInLobbyAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        _lobbyRepository.Setup(repo => repo.GetLobbyByJoinCodeAsync(joinCode, It.IsAny<CancellationToken>()))
            .ReturnsAsync(lobby);
        _lobbyRepository.Setup(repo => repo.AddUserToLobbyAsync(lobby.Id, userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(lobby);

        // Act
        var result = await _lobbyService.JoinLobbyAsync(userId, joinCode);

        // Assert
        result.IsT0.Should().BeTrue();
        result.AsT0.Should().BeEquivalentTo(lobby);
    }

    [Test]
    public async Task LeaveLobbyAsync_ShouldReturnNotFound_WhenUserIsNotInLobby()
    {
        // Arrange
        var userId = Guid.NewGuid();

        _lobbyRepository.Setup(repo => repo.GetLobbyByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Lobby?)null);

        // Act
        var result = await _lobbyService.LeaveLobbyAsync(userId);

        // Assert
        result.IsT1.Should().BeTrue();
    }

    [Test]
    public async Task LeaveLobbyAsync_ShouldReturnError_WhenLeavingLobbyFails()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var lobby = new Lobby { Id = Guid.NewGuid() };

        _lobbyRepository.Setup(repo => repo.GetLobbyByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(lobby);
        _lobbyRepository.Setup(repo => repo.RemoveUserFromLobbyAsync(lobby.Id, userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Lobby?)null);

        // Act
        var result = await _lobbyService.LeaveLobbyAsync(userId);

        // Assert
        result.IsT2.Should().BeTrue();
    }

    [Test]
    public async Task LeaveLobbyAsync_ShouldReturnLobby_WhenSuccessful()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var lobby = new Lobby { Id = Guid.NewGuid() };

        _lobbyRepository.Setup(repo => repo.GetLobbyByUserIdAsync(userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(lobby);
        _lobbyRepository.Setup(repo => repo.RemoveUserFromLobbyAsync(lobby.Id, userId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(lobby);

        // Act
        var result = await _lobbyService.LeaveLobbyAsync(userId);

        // Assert
        result.IsT0.Should().BeTrue();
        result.AsT0.Should().BeEquivalentTo(lobby);
    }
}