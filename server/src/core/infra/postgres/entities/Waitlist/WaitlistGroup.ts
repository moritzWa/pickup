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
    OneToMany,
} from "typeorm";
import { User } from "../User";
import { AccountProvider, TransactionType } from "../types";
import { WaitlistGroupMember } from "./WaitlistGroupMember";

@Entity({
    name: "waitlist_groups",
})
export class WaitlistGroup {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "name",
    })
    name!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "memecoin",
    })
    memecoin!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "memecoin_image_url",
    })
    memecoinImageUrl!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "referral_code",
    })
    @Index("waitlist_groups_referral_code_index", { unique: true })
    referralCode!: string;

    @OneToMany(() => WaitlistGroupMember, (transfer) => transfer.group)
    members!: WaitlistGroupMember[];

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
