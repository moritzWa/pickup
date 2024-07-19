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

@Entity({
    name: "waitlist_users",
})
export class WaitlistUser {
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
        name: "phone_number",
    })
    @Index("waitlist_users_phone_number_index", { unique: true })
    phoneNumber!: string;

    @Column({
        nullable: true,
        type: "text",
        name: "memecoin",
    })
    memecoin!: Maybe<string>;

    @Column({
        nullable: true,
        type: "text",
        name: "memecoin_image_url",
    })
    memecoinImageUrl!: Maybe<string>;

    @Column({
        nullable: false,
        type: "text",
        name: "referral_code",
    })
    @Index("waitlist_users_referral_code_idx", { unique: true })
    referralCode!: string;

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
