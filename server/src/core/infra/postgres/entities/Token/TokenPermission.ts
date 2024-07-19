import { Maybe } from "src/core/logic";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    Index,
    Unique,
    Relation,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm";
import { User } from "../User";
import { Swap } from "../Trading/Swap";
import { Token } from "./Token";

@Entity({
    name: "token_permissions",
})
@Unique("token_permissions_token_user_idx", ["tokenId", "userId"])
export class TokenPermission {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        type: "text",
        name: "claim_code",
        unique: true,
    })
    claimCode!: string;

    @Column({
        nullable: false,
        type: "uuid",
        name: "token_id",
    })
    tokenId!: string;

    @Column({
        nullable: true,
        type: "uuid",
        name: "user_id",
    })
    userId!: Maybe<string>;

    @ManyToOne(() => Token, (t) => t.id, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "token_id" })
    token!: Relation<Token>;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: true,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_id" })
    user!: Relation<Maybe<User>>;

    @CreateDateColumn({
        name: "created_at",
    })
    createdAt!: Date;

    @UpdateDateColumn({
        name: "updated_at",
    })
    updatedAt!: Date;
}
