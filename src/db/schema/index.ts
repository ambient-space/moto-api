import {
	authSession,
	authSessionRelations,
	authUser,
	authUserRelations,
} from "./auth"
import {
	announcement,
	community,
	communityMember,
	communityMemberRelations,
	communityRelations,
	message,
	messageRelations,
} from "./community"
import {
	trip,
	tripParticipant,
	tripParticipantRelations,
	tripRelations,
} from "./trip"
import {
	userProfile,
	userProfileRelations,
	userVehicles,
	userVehiclesRelations,
} from "./user"
import { vehicle } from "./vehicle"

export const schema = {
	authSession,
	authUser,
	authUserRelations,
	authSessionRelations,

	announcement,
	community,
	communityRelations,
	communityMember,
	communityMemberRelations,
	message,
	messageRelations,

	userProfile,
	userProfileRelations,
	userVehicles,
	userVehiclesRelations,

	trip,
	tripRelations,
	tripParticipant,
	tripParticipantRelations,

	vehicle,
}
