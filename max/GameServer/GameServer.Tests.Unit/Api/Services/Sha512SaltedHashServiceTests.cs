using GameServer.Api.Services;

namespace GameServer.Tests.Unit.Api.Services;

[TestFixture]
[TestOf(typeof(Sha512SaltedHashService))]
public class Sha512SaltedHashServiceTests
{
    [Test]
    public void HashData_WithSameData_ShouldProduceSameHash()
    {
        // Arrange
        var commonSalt = new byte[] { 1, 2, 3, 4, 5 };
        var service = new Sha512SaltedHashService(commonSalt);
        var data = new byte[] { 6, 7, 8, 9, 10 };
        var salt = new byte[] { 11, 12, 13, 14, 15 };

        // Act
        var hash1 = service.HashData(data, salt);
        var hash2 = service.HashData(data, salt);

        // Assert
        hash1.Should().NotBeNull();
        hash1.Should().HaveCount(64);
        hash1.Should().BeEquivalentTo(hash2);
    }

    [Test]
    public void HashData_WithDifferentData_ShouldProduceDifferentHash()
    {
        // Arrange
        var commonSalt = new byte[] { 1, 2, 3, 4, 5 };
        var service = new Sha512SaltedHashService(commonSalt);
        var data1 = new byte[] { 6, 7, 8, 9, 10 };
        var data2 = new byte[] { 6, 7, 8, 9, 20 };
        var salt = new byte[] { 11, 12, 13, 14, 15 };

        // Act
        var hash1 = service.HashData(data1, salt);
        var hash2 = service.HashData(data2, salt);

        // Assert
        hash1.Should().NotBeNull();
        hash1.Should().HaveCount(64);
        hash1.Should().NotBeEquivalentTo(hash2);
    }

    [Test]
    public void HashData_WithNullSalt_ShouldUseCommonSalt()
    {
        // Arrange
        var commonSalt1 = new byte[] { 1, 2, 3, 4, 5 };
        var commonSalt2 = new byte[] { 1, 2, 3, 4, 9 };
        var service1 = new Sha512SaltedHashService(commonSalt1);
        var service2 = new Sha512SaltedHashService(commonSalt2);
        var data = new byte[] { 6, 7, 8, 9, 10 };

        // Act
        var hash1 = service1.HashData(data);
        var hash2 = service2.HashData(data);

        // Assert
        hash1.Should().NotBeNull();
        hash1.Should().HaveCount(64);
        hash1.Should().NotBeEquivalentTo(hash2);
    }

    [Test]
    public void HashData_WithDifferentSalts_ShouldProduceDifferentHash()
    {
        // Arrange
        var commonSalt = new byte[] { 1, 2, 3, 4, 5 };
        var service = new Sha512SaltedHashService(commonSalt);
        var data = new byte[] { 6, 7, 8, 9, 10 };
        var salt1 = new byte[] { 11, 12, 13, 14, 15 };
        var salt2 = new byte[] { 11, 12, 13, 14, 20 };

        // Act
        var hash1 = service.HashData(data, salt1);
        var hash2 = service.HashData(data, salt2);

        // Assert
        hash1.Should().NotBeNull();
        hash2.Should().HaveCount(64);
        hash1.Should().NotBeEquivalentTo(hash2);
    }

    [Test]
    public void GenerateRandomBytes_WithLength_ShouldReturnRandomBytes()
    {
        // Arrange
        var service = new Sha512SaltedHashService([]);
        const int length = 64;

        // Act
        var result = service.GenerateRandomBytes(length);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(64);
    }
}