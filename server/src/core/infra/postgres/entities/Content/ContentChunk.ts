import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Relation,
} from "typeorm";
import { Content } from "./Content";

@Entity({ name: "content_chunks" })
export class ContentChunk {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({
        name: "chunk_index",
        type: "text",
    })
    chunkIndex!: number;

    @Column({
        name: "idempotency",
        type: "text",
        unique: true,
        // generate uuid v4
        default: () => "uuid_generate_v4()",
    })
    idempotency!: string;

    @Column({
        name: "transcript",
        type: "text",
    })
    transcript!: string;

    @Column({
        type: "vector" as any,
    })
    embedding!: any;

    @Column({
        nullable: false,
        name: "content_id",
        type: "uuid",
    })
    contentId!: string;

    @ManyToOne(() => Content, (c) => c.chunks)
    @JoinColumn({ name: "content_id" })
    content!: Relation<Content>;
}
