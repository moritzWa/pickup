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
import { WaitlistUser } from "./WaitlistUser";

@Entity({
    name: "waitlist_referrals",
})
@Unique("waitlist_referrals_referrer_id_referred_id_unique_idx", [
    "referrerId",
    "referredId",
])
export class WaitlistReferral {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    // from the user
    @Column({
        nullable: false,
        type: "text",
        name: "referrer_id",
    })
    referrerId!: string;

    // to the user
    @Column({
        nullable: false,
        type: "text",
        name: "referred_id",
    })
    referredId!: string;

    @ManyToOne(() => WaitlistUser, (t) => t.id, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "referred_id" })
    @Index("waitlist_referrals_referred_id_idx")
    referredUser!: Relation<WaitlistUser>;

    @ManyToOne(() => WaitlistUser, (t) => t.id, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "referrer_id" })
    @Index("waitlist_referrals_referrer_id_idx")
    referrerUser!: Relation<WaitlistUser>;

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
