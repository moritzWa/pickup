import { Maybe } from "src/core/logic";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Relation,
    Unique,
    Index,
} from "typeorm";
import { User } from "../User";
import { AccountProvider, TransactionType } from "../types";
import { WaitlistGroup } from "./WaitlistGroup";

@Entity({
    name: "waitlist_group_members",
})
@Unique("waitlist_group_members_group_id_phone_number_key", [
    "groupId",
    "phoneNumber",
])
export class WaitlistGroupMember {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "name",
    })
    name!: string;

    @Column({
        nullable: true,
        type: "text",
        name: "phone_number",
    })
    phoneNumber!: string;

    @Column({
        nullable: false,
        type: "boolean",
        name: "is_owner",
    })
    isOwner!: boolean;

    @Column({
        nullable: false,
        type: "uuid",
        name: "group_id",
    })
    groupId!: string;

    @ManyToOne(() => WaitlistGroup, (t) => t.id, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "group_id" })
    @Index("waitlist_group_members_group_id_index")
    group!: Relation<WaitlistGroup>;

    @Column({
        nullable: false,
        type: "timestamp",
        name: "created_at",
        default: () => "NOW()",
    })
    createdAt!: Date;

    @Column({
        nullable: false,
        type: "timestamp",
        name: "updated_at",
        default: () => "NOW()",
    })
    updatedAt!: Date;
}
