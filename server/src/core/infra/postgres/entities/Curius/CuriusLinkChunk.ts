import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { CuriusLink } from "./CuriusLink";

@Entity({ name: "curius_link_chunks" })
export class CuriusLinkChunk {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    chunkIndex!: number;

    @Column("text")
    text!: string;

    @Column("text")
    embedding!: string; // actually VECTOR(256). vector type not supported: https://github.com/typeorm/typeorm/issues/10056

    @ManyToOne(() => CuriusLink, (link) => link.chunks, { lazy: true })
    link!: Promise<CuriusLink>;
}
