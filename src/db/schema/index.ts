import {
	authSession,
	authSessionRelations,
	authUser,
	authUserRelations,
} from "./auth"
import {
	announcement,
	community,
	communityInvite,
	communityInviteRelations,
	communityJoinRequest,
	communityJoinRequestRelations,
	communityMember,
	communityMemberRelations,
	communityRelations,
	message,
	messageRelations,
} from "./community"
import {
	trip,
	tripInvite,
	tripInviteRelations,
	tripJoinRequest,
	tripJoinRequestRelations,
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
	communityInvite,
	communityInviteRelations,
	communityJoinRequest,
	communityJoinRequestRelations,

	userProfile,
	userProfileRelations,
	userVehicles,
	userVehiclesRelations,

	trip,
	tripRelations,
	tripParticipant,
	tripParticipantRelations,
	tripInvite,
	tripInviteRelations,
	tripJoinRequest,
	tripJoinRequestRelations,

	vehicle,
}
