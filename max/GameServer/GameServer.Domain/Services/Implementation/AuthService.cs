using System.Text;
using GameServer.Domain.Models;
using GameServer.Domain.Repositories;
using OneOf;
using OneOf.Types;

namespace GameServer.Domain.Services.Implementation;

public class AuthService(
    IUserRepository userRepository, IAuthSessionRepository sessionRepository, IAuthRoleRepository roleRepository, ISaltedHashService saltedHashService) : IAuthService
{
    public async Task<RegisterResult> RegisterAsync(AuthRegistration registration, IEnumerable<string> roles, CancellationToken token = default)
    {
        var existingUser = await userRepository.GetUserByUsernameAsync(registration.Username, token);
        if (existingUser is not null)
            return new AlreadyExists();

        var passwordData = Encoding.UTF8.GetBytes(registration.Password);
        var passwordSalt = saltedHashService.GenerateRandomBytes(8);
        var passwordHash = saltedHashService.HashData(passwordData, passwordSalt);

        var user = await userRepository.CreateUserAsync(
            registration.Username,
            passwordSalt,
            passwordHash,
            registration.DisplayName,
            token);

        if (user is null)
            return new Error<string>("Failed to create user.");

        var addedRoles = new List<string>();
        foreach (var role in roles)
            if (await roleRepository.AddRoleToUserAsync(user.Id, role, token))
                addedRoles.Add(role);

        return user with { Roles = addedRoles };
    }

    public async Task<LoginResult> LoginAsync(AuthCredentials credentials, CancellationToken token = default)
    {
        var user = await userRepository.GetUserByUsernameAsync(credentials.Username, token);
        if (user is null)
            return new NotFound();

        var passwordData = Encoding.UTF8.GetBytes(credentials.Password);
        var passwordHash = saltedHashService.HashData(passwordData, user.PasswordSalt);

        if (!passwordHash.SequenceEqual(user.PasswordHash))
            return new NotFound();

        var existingSessions = await sessionRepository.GetActiveSessionsByUserAsync(user.Id, token);

        foreach (var session in existingSessions)
        {
            var result = await sessionRepository.RevokeSessionAsync(session.Id, token);
            if (!result)
                return new Error<string>("Failed to delete existing session.");
        }

        var authTokenData = saltedHashService.GenerateRandomBytes(32);
        var authTokenHash = saltedHashService.HashData(authTokenData);

        var authSession = await sessionRepository.CreateSessionAsync(user.Id, authTokenHash, token);

        if (authSession is null)
            return new Error<string>("Failed to create session.");

        return new AuthSession
        {
            Id = authSession.Id,
            User = user,
            TokenData = authTokenData,
            CreatedAt = authSession.CreatedAt,
            ExpiresAt = authSession.ExpiresAt
        };
    }

    public async Task<LogoutResult> LogoutAsync(byte[] authTokenData, CancellationToken token = default)
    {
        var authTokenHash = saltedHashService.HashData(authTokenData);

        var session = await sessionRepository.GetSessionByTokenHashAsync(authTokenHash, token);
        if (session is null)
            return new NotFound();

        var result = await sessionRepository.RevokeSessionAsync(session.Id, token);
        return result ? new Success() : new Error<string>("Failed to delete session.");
    }

    public async Task<OneOf<AuthSessionInfo, NotFound, Unauthorized, Error<string>>> GetSessionAsync(byte[] authTokenData, CancellationToken token = default)
    {
        var authTokenHash = saltedHashService.HashData(authTokenData);

        var session = await sessionRepository.GetSessionByTokenHashAsync(authTokenHash, token);

        if (session is null)
            return new NotFound();

        return session.RevokedAt.HasValue || session.ExpiresAt < DateTime.UtcNow ? new Unauthorized() : session;
    }

    public async Task<OneOf<User, NotFound, Unauthorized, Error<string>>> UpdateProfileAsync(byte[] authTokenData, UserUpdate userUpdate, CancellationToken token = default)
    {
        var authTokenHash = saltedHashService.HashData(authTokenData);

        var session = await sessionRepository.GetSessionByTokenHashAsync(authTokenHash, token);
        if (session is null)
            return new NotFound();

        var user = await userRepository.UpdateUserAsync(session.User.Id, userUpdate.DisplayName, token);
        if (user is null)
            return new NotFound();

        return user;
    }
}