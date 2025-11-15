import { UserRepository } from "../../../domain/users/UserRepository";
import { PasswordService } from "../services/PasswordService";
import { TokenService } from "../services/TokenService";
import { RefreshTokenService } from "../services/RefreshTokenService";
import { toAuthUserView } from "../mappers/toAuthUserView";

interface RegisterClientInput {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export class RegisterClient {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly refreshTokenService: RefreshTokenService
  ) {}

  async execute(input: RegisterClientInput) {
    const { fullName, email, password, phone } = input;

    // 1️⃣ Kiểm tra xem email đã tồn tại chưa
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new Error("Email đã được sử dụng. Vui lòng chọn email khác.");
    }

    // 2️⃣ Hash password
    const hashedPassword = await this.passwordService.hash(password);

    // 3️⃣ Tạo user mới
    const newUser = await this.userRepo.create({
      fullName,
      email,
      passwordHash: hashedPassword,
      phone: phone ?? null,
    });

    // 4️⃣ Tạo access token + refresh token
    const accessToken = this.tokenService.signAccessToken({
      sub: newUser.props.id!,
      email: newUser.props.email,
      roleId: newUser.props.roleId ?? null,
    });

    const refreshToken = this.refreshTokenService.generate();
    await this.userRepo.updateApiToken(newUser.props.id!, refreshToken.hash);

    // 5️⃣ Trả về thông tin user + token
    return {
      user: toAuthUserView(newUser),
      accessToken,
      refreshToken: refreshToken.raw,
    };
  }
}
