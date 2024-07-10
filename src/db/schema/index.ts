import { authSession, authUser } from "./auth"
import {
	announcement,
	community,
	communityMember,
	communityMemberRelations,
	communityRelations,
	message,
} from "./community"
import {
	trip,
	tripParticipant,
	tripParticipantRelations,
	tripRelations,
} from "./trip"
import { userProfile, userProfileRelations } from "./user"

export const schema = {
	authSession,
	authUser,
	announcement,

	community,
	communityRelations,
	communityMember,
	communityMemberRelations,
	message,

	userProfile,
	userProfileRelations,

	trip,
	tripRelations,
	tripParticipant,
	tripParticipantRelations,
}
