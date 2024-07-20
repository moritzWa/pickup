import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    Index,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    DeleteDateColumn,
    Unique,
} from "typeorm";
import { User } from "./User";

@Entity({
    name: "characters",
})
export class Character {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        nullable: false,
        name: "context",
        type: "text",
    })
    context!: string;

    @Column({
        nullable: false,
        name: "image_url",
        type: "text",
    })
    imageUrl!: string;

    @Column({
        nullable: false,
        name: "name",
        type: "text",
    })
    name!: string;

    @Column({
        nullable: false,
        name: "user_id",
        type: "uuid",
    })
    @Index("messages_user_id_idx")
    userId!: string;

    @ManyToOne(() => User, (t) => t.id, {
        nullable: false,
        eager: false,
        onDelete: "CASCADE",
    })
    @JoinColumn({ name: "user_id" })
    user!: User;

    @CreateDateColumn({
        name: "created_at",
    })
    createdAt!: Date;

    @UpdateDateColumn({
        name: "updated_at",
    })
    updatedAt!: Date;

    @DeleteDateColumn({
        name: "deleted_at",
    })
    deletedAt?: Date;
}
