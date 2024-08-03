import { Maybe } from "src/core/logic";
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    OneToMany,
    ManyToOne,
    JoinColumn,
    Relation,
    Unique,
} from "typeorm";
import { User } from "src/core/infra/postgres/entities/User";

@Entity({
    name: "relationships",
})
@Unique("relationships_idx", ["fromUserId", "toUserId"])
export class Relationship {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    // from user id
    @Column({
        nullable: false,
        name: "from_user_id",
    })
    @Index("from_user_id_idx")
    fromUserId!: string;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "from_user_id" })
    fromUser!: User;

    // to user id
    @Column({
        nullable: false,
        name: "to_user_id",
    })
    @Index("to_user_id_idx")
    toUserId!: string;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "to_user_id" })
    toUser!: User;
}
