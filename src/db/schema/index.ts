import { authSession, authUser } from "./auth"
import {
	announcement,
	community,
	communityMember,
	communityMemberRelations,
	communityRelations,
	message,
} from "./community"
import { trip } from "./trip"
export { userProfile, kycDocument } from "./user"

export const schema = {
	authSession,
	authUser,
	announcement,
	community,
	communityRelations,
	communityMember,
	communityMemberRelations,
	message,
	trip,
}
