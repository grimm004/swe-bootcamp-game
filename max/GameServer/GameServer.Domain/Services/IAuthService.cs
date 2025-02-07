using GameServer.Domain.Models;
using OneOf;
using OneOf.Types;

namespace GameServer.Domain.Services;

public interface IAuthService
{
    Task<RegisterResult> RegisterAsync(AuthRegistration registration, CancellationToken token = default);
    Task<LoginResult> LoginAsync(AuthCredentials credentials, CancellationToken token = default);
    Task<LogoutResult> LogoutAsync(string authToken, CancellationToken token = default);
    Task<OneOf<AuthSessionInfo, NotFound, Unauthorized, Error<string>>> GetSessionAsync(string authToken, CancellationToken token = default);
    Task<OneOf<User, NotFound, Unauthorized, Error<string>>> UpdateProfileAsync(string authToken, UserUpdate userUpdate, CancellationToken token = default);
}

public struct Unauthorized;

[GenerateOneOf]
public partial class RegisterResult : OneOfBase<User, AlreadyExists, Error<string>>;

[GenerateOneOf]
public partial class LoginResult : OneOfBase<AuthSession, NotFound, Error<string>>;

[GenerateOneOf]
public partial class LogoutResult : OneOfBase<Success, NotFound, Error<string>>;