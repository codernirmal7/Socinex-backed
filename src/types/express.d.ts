import { IUserDocument } from '../features/users/user.model';

declare global {
    namespace Express {
        interface Request {
            user?: IUserDocument;
        }
    }
}
